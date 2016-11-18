---
layout: post
title: Property Order for Enclosed Records in HPE Records Manager
date: 2016-10-31 11:26:00
categories: trimsdk
excerpt_separator: <!--more-->
---

I work on a big web application, [RM Workspace][rmw], that integrates with HPE Records Manager. In HPE RM, a *record* can have a *container* record. A record has an *Assignee*, or *Current Location*, that specifies a person or group that is responsible for that record. When a record is *enclosed* in a container, that overrides the assignee, and the effective assignee becomes the container of the record. This all harks back to paper folders, and paper files. As an example, when a paper file is assigned to someone, that means it's on their desk, and when it's enclosed, that signifies it's back in its manila folder.

So, we have this bug. A record has a *RecordType*, and here we set record defaults. When the RecordType has its enclosed property defaulted to *yes*, trying to set it to *no* as part of the record creation was being ignored. So on the record entry form, we set the container, untick enclosed, and set an assignee, and the "not enclosed" and assignee values are ignored. Perplexing!

<!--more-->

I've been working with HPE RM in it's various iterations for over 15 years (oh god, that's too long), and I seemed to recall that the order in which you apply fields can matter. So I changed the order to container, assignee and enclosed, and what do you know, it worked!

I deployed a new version to test, happy with a job well done. But it came back from test - reopened, still a bug. It turns out my fix only worked for RM version 8.3. In version 7.3 (called HP TRIM 7.3 - so many name changes) and HPE RM 8.1, that order didn't fix the issue.

So, I then spent way too long [writing some code][ghc] that would attempt to set the fields container, assignee and enclosed in all the order permutations possible. The possible orders are:

    container -> assignee  -> enclosed
    container -> enclosed  -> assignee
    assignee  -> container -> enclosed
    assignee  -> enclosed  -> container
    enclosed  -> container -> assignee
    enclosed  -> assignee  -> container

The [console app I wrote][ghc] sets each of these properties in each of the orders, and then tests to see if the values are what they're meant to be. Here's the output in my HPE RM 8.3 dev environment:
    
    -> Container-> Assignee-> Enclosed
    SUCCESS >>> Container: correct -> Assignee: correct -> Enclosed: correct

    -> Container-> Enclosed-> Assignee
    SUCCESS >>> Container: correct -> Enclosed: correct -> Assignee: correct

    -> Assignee-> Container-> Enclosed
    FAILED >>> Assignee: WRONG -> Container: correct -> Enclosed: WRONG

    -> Assignee-> Enclosed-> Container
    FAILED >>> Assignee: WRONG -> Enclosed: WRONG -> Container: correct

    -> Enclosed-> Container-> Assignee
    SUCCESS >>> Enclosed: correct -> Container: correct -> Assignee: correct

    -> Enclosed-> Assignee-> Container
    FAILED >>> Enclosed: WRONG -> Assignee: WRONG -> Container: correct

This confirms that the order does indeed matter, and shows that it succeeds anytime assignee is set *after* container. Where enclosed happens in that order doesn't matter.

However, running the same code in TRIM 7.3 or RM 8.1 produces the result:

    -> Container-> Assignee-> Enclosed
    FAILED >>> Container: correct -> Assignee: WRONG -> Enclosed: WRONG

    -> Container-> Enclosed-> Assignee
    FAILED >>> Container: correct -> Enclosed: WRONG -> Assignee: WRONG

    -> Assignee-> Container-> Enclosed
    FAILED >>> Assignee: WRONG -> Container: correct -> Enclosed: WRONG

    -> Assignee-> Enclosed-> Container
    FAILED >>> Assignee: WRONG -> Enclosed: WRONG -> Container: correct

    -> Enclosed-> Container-> Assignee
    FAILED >>> Enclosed: WRONG -> Container: correct -> Assignee: WRONG

    -> Enclosed-> Assignee-> Container
    FAILED >>> Enclosed: WRONG -> Assignee: WRONG -> Container: correct

Every permutation failed. The order does matter at all in those versions, it just doesn't work?? So I then used the official client application for both those versions, and what do you know, it doesn't work in the HPE application either.

What did we learn? That my original fix worked for RM 8.3, and so all the effort spend writing my order tester and trying it for TRIM 7.3 and RM 8.1 was wasted, because the underlying application has the same error. And then I compounded the time wasting by writing this blog post.

However, I did enjoy writing my little experiment code, with it's property setter and tester delegates, and the recursive permutation function. And in the end, isn't that the most important thing?

Maybe.

Matt.

[rmw]: http://www.rmworkspace.com.au/ "RM Workspace"
[ghlink]: https://github.com/MattBayliss/EncloseTesterRM "GitHub repository MattBayliss/EncloseTesterRM"