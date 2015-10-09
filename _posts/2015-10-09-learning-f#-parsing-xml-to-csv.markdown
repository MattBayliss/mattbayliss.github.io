---
layout: post
title: Learning F# - Parsing XML to CSV
date: 2015-10-09 17:00:00
categories: f#
excerpt_separator: <!--more-->
---
I have a problem. It's called [SpiraTest](https://www.inflectra.com/SpiraTest/).

> SpiraTest provides a complete Quality Assurance solution that manages requirements, tests, bugs and issues in one environment, with complete traceability from inception to completion.

Well, it's certainly got a lot of features, but I don't find it very usable, so I'd like to plan and track our project progress with [PivotalTracker.com](www.pivotaltracker.com) instead. Spira exports an XML file, PivotalTracker imports a CSV file.

I've really wanted to learn (and actually become good at) a functional programming language for a long time now. I dabbled with some Erlang years ago, but now I have settled on F# as my weapon of choice, primarily because as a C# programmer, keeping stuff in the Microsoft.Net family should make things easier for me, and make it easier to put F# bits in my C# programs and vice-versa.

<!--more-->

So, despite numerous project deadlines, I thought it's time to use some F# in anger. So, with the proviso that I barely know what I'm doing, let's get to it.
Here's a simplified sample of the XML that Spira exports:

    <IncidentData>
        <Incident>
            <IncidentId>3307</IncidentId>
            <Name>When clicking to any page or opening any window/pane the cursor should be already in the most likely text input field ready to type without further mouse clicks first</Name>
            <EstimatedEffort>4.00</EstimatedEffort>
            <CreationDate>2013-02-21T14:52:25</CreationDate>
            <IncidentTypeName>Bug</IncidentTypeName>
            <Description>This is very very very long in Spira, so I'll be ignoring this field entirely - and instead create a markdown link from PivotalTracker to our SpiraTest server</Description>
        </Incident>
    </IncidentData>
    
There's a *lot* more metadata than these six fields, but let's start there.
Here's an example of the CSV that PivotalTracker imports:

    Id,Title,Labels,Type,Estimate,Current State,Created at,Accepted at,Deadline,Requested By,Owned By,Description,Comment,Comment
    100, existing started story,"label one,label two",feature,1,started,"Nov 22, 2007",,,user1,user2,this will update story 100,,
    ,new story,label one,feature,-1,unscheduled,,,,user1,,this will create a new story in the icebox,comment1,comment2

PivotalTracker stories aren't really analogous to Spira incidents - for example Spira "Name" is not the nice succinct title of a Story title, so there'll be some manual tidying up of things - probably as we assign them to a Sprint. If you don't know these terms, it doesn't matter - we're converting an XML structure to a CSV one. For this first attempt, I've created the following F# types:

    type StoryType = Feature | Bug | Chore | Release

    type Story = {
        Title : string;
        Labels : string;
        Type : StoryType;
        Description : string;
        Estimate : int;
        CurrentState : string;
        CreatedAt : DateTime;
    }

StoreType is a [Union](https://msdn.microsoft.com/en-us/library/dd233226.aspx), and Story is a [Record](https://msdn.microsoft.com/en-us/library/dd233184.aspx). For my mappings, I want to populate a Story record with values from the Spira Incident XML element as follows:

* *Title:* Incident\Name.
* *Labels:* Incident\IncidentTypeName.
* *Type:* Feature - ended up defaulting this to Feature because it's the only type in PivotalTracker that supports an estimate.
* *Description:* Incident\IncidentId & Incident\Name - Using the IncidentId I can generate a link back to our internal SpiraTest server so more information can be retrieved.
* *Estimate:* Incident\EstimatedEffort - This is a decimal in Spira, with the number part being days effort, and the decimal the number of hours. i.e. 3.04 would be 3 days and 4 hours worth of effort. PivotalTracker however uses a point system for effort, from 0 to 3, with -1 for no estimate.
* *CurrentState:* unscheduled - the default for a new story in the backlog
* *CreatedAt:* Incident\CreationDate

One of the tricky things I struggled with a bit was parsing the EstimatedEffort decimal and the rules to convert that into a PivotalTracker estimate. However stumbling onto active patterns made Double.TryParse calls so easy!

Here's the DateTime active pattern and how I used it in my pattern matching:

    // active pattern
    let (|Double|_|) = System.Double.TryParse >> function
        | true, v -> Some v
        | false, _ -> None

    let convertSpiraToPTEstimate = function
        | Double d when d <= 0.0 -> -1 // negative numbers, set to no estimate
        | Double d when d < 0.02 -> 0  // under 2 hours call the effort negligible - 0
        | Double d when d <= 0.04 -> 1 // between 2 and 4 hours, effort of 1
        | Double d when d <= 0.08 -> 2 // between 4 and 8 hours, effort of 2
        | Double d -> 3                // any hours more than 8, effort of 3 (the highest)
        | _ -> -1                      // can't be parsed as a Double - no estimate


Thanks to F# converting C# functions with out parameters to return tuples instead, the function:

    bool Double.TryParse(string input, out double value)
    
In F# returns a tuple (result : bool, value : double) instead.

When used in the pattern matching function convertSpiraToPTEstimate above, each condition is tested in turn, and as soon as a condition returns "Some", the match is completed and the result returned. So the condition:

    Double d when d <= 0.0
    
Returns *Some d* when d is a double less than zero, and *None* when d is a double greater than zero, and also None when d is not a double at all! Cool huh? I think so.

Other than that, the only extra difficulty was parsing dates, but again, active patterns activate! If the string is a date, return the date, otherwise return the date 1/1/2000

    let (|DateTime|_|) = System.DateTime.TryParse >> function
        | true, v -> Some v
        | false, _ -> None

    let parseDateTime = function
        | DateTime d -> d
        | _ -> new DateTime(2000, 1, 1)

Too easy!

Anyway, below is the code in its entirety. I'll mention again that I'm new and there's no doubt improvements that can be made. Does it work? *Actually, no it doesn't*. I need to escape double quotes (") in the Title and Description fields, and so that's on the list of things to do.

    open System
    open System.Xml
    open System.IO

    type StoryType = Feature | Bug | Chore | Release

    type Story = {
        Title : string;
        Labels : string;
        Type : StoryType;
        Description : string;
        Estimate : int;
        CurrentState : string;
        CreatedAt : DateTime;
    }

    let (|DateTime|_|) = System.DateTime.TryParse >> function
        | true, v -> Some v
        | false, _ -> None

    let (|Double|_|) = System.Double.TryParse >> function
        | true, v -> Some v
        | false, _ -> None

    let convertSpiraToPTEstimate = function
        | Double d when d <= 0.0 -> -1 // negative numbers, set to no estimate
        | Double d when d < 0.02 -> 0  // under 2 hours call the effort negligible - 0
        | Double d when d <= 0.04 -> 1 // between 2 and 4 hours, effort of 1
        | Double d when d <= 0.08 -> 2 // between 4 and 8 hours, effort of 2
        | Double d -> 3                // any hours more than 8, effort of 3 (the highest)
        | _ -> -1                      // can't be parsed as a Double - no estimate

    let parseDateTime = function
        | DateTime d -> d
        | _ -> new DateTime(2000, 1, 1)

    let subElementValue (node : XmlElement) (element : string) =
        node.SelectSingleNode(element).InnerText

    let createDescription incidentNumber description = 
        sprintf "IN[%s](http://spira/36/Incident/%s.aspx): %s" incidentNumber incidentNumber description

    let incidentNodeToStory (node : XmlElement) =
        {
            Title = (subElementValue node "Name"); 
            Labels = "";
            Type = Feature; 
            Description = createDescription (subElementValue node "IncidentId") (subElementValue node "Name"); 
            Estimate = convertSpiraToPTEstimate (subElementValue node "EstimatedEffort");
            CurrentState = "unscheduled";
            CreatedAt = parseDateTime (subElementValue node "CreationDate");
        }

    let incidentNodes filePath = 
        let doc = new XmlDocument()
        doc.Load(filePath : string)
        doc.SelectNodes("//IncidentData/Incident") |> Seq.cast<XmlElement> |> Seq.map incidentNodeToStory

    let writeStory (writer:TextWriter) (story: Story) =
        let inline write (value:'a) =
            fprintf writer "%A," value
        write "" //Id
        write story.Title
        write story.Labels
        write story.Type
        write story.Estimate
        write story.CurrentState
        write (story.CreatedAt.ToString("MMM d, yyyy"))
        write "" // Accepted at
        write "" // deadline
        write "" // requested by
        write "" // owned by
        write story.Description
        write "" // comment 1
        writer.WriteLine();

    let convertToCsv inputXmlPath (outputCsvPath : string) = 
        let csvFile = File.CreateText(outputCsvPath)
        csvFile.WriteLine("Id,Title,Labels,Type,Estimate,Current State,Created at,Accepted at,Deadline,Requested By,Owned By,Description,Comment,Comment")
        incidentNodes inputXmlPath |> Seq.iter (fun s -> writeStory csvFile s)
        csvFile.Close()

I'm loving F#, and will try to find more excuses to use it in the future!

Matt.        
        
References

* [F# Snippets: Functional wrappers for TryParse APIs](http://fssnip.net/2y)
* [http://luketopia.net/2014/02/05/fsharp-and-output-parameters/](http://luketopia.net/2014/02/05/fsharp-and-output-parameters/)
* [http://fsharpforfunandprofit.com/](http://fsharpforfunandprofit.com/)

