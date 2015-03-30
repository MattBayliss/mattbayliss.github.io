---
layout: post
title: Property name changes from TRIM version 6 to 7
date: 2011-09-28 15:11:52
categories: trimsdk
excerpt_separator: ""
---

All TRIM objects have properties, and pretty much all of them are accessible in two ways:

1. Directly: `string rectitle = record.Title;`
1. Through a property id: `string rectitle = (string)record.GetProperty(3); //where 3 == recTitle`

To find out all the Property IDs for a TRIM object type, you can use the following code in C#:

{% highlight csharp %}
using System;
using TRIMSDK;

namespace ComTrimTests
{
    class Program
    {
        static void Main(string[] args)
        {
            PropertyDefs recproperties = new PropertyDefs();
            recproperties.SelectAll(btyBaseObjectTypes.btyRecord);
            foreach (PropertyDef pd in recproperties)
            {
                Console.WriteLine("{0}: {1}", pd.InternalName, pd.Id);
            }
            Console.ReadLine();
        }
    }
}
{% endhighlight %}

It's generally good programming practice to avoid accessing enumerations by their internal number, but as the GetProperty method expects an Int, it's really easy to do just that, and then get into trouble when the numbers change in a new version of the SDK. Say for instance going from TRIM 6.* to TRIM 7. The issue I had was that the recDateUpdated property ID number changed breaking a TRIM 6 application that we tried on TRIM 7.

"Why would you ever use GetProperty when you can just use the 'proper' property?" I hear you ask. Well, when you have an application that allows a user to configure what metadata they want to display for instance. You might define each column in a table with a caption and a TRIM Property Id.

"Then don't use numbers, use the name, you fool!"

OK, so you could reverse things, do something like:
{% highlight csharp %}
PropertyDefs recproperties = new PropertyDefs();
recproperties.SelectAll(btyBaseObjectTypes.btyRecord);
Dictionary recprops = new Dictionary();
foreach (PropertyDef pd in recproperties)
{
    recprops.Add(pd.InternalName, pd);
}

string rectitle = (string)record.GetProperty(recprops["recTitle"].Id);
{% endhighlight %}

That seems much cleaner. Use the `InternalName` as your lookup, don't rely on numbers. But would you believe some names changed too?

So, if you've encountered the same issue, or are about to, below is a list of Record Properties that are different in TRIM 7. I haven't compiled a list for the other TRIM object types, but using code similar to what I've used above, you can run it on different environments and compare the lists.

The table shows the differences in Internal Names, but the rows in bold are the ones where the Id number changed too (but there were only the two occurrences of that).

<table>
<tbody>
<tr>
<th colspan="2">TRIM 7</th>
<th colspan="2">TRIM 6</th>
</tr>
<tr>
<th>Id</th>
<th>InternalName</th>
<th>Id</th>
<th>InternalName</th>
</tr>
<tr>
<td>11</td>
<td>recAccessionNumber</td>
<td>11</td>
<td>recAccessionNbr</td>
</tr>
<tr>
<td><strong>37</strong></td>
<td><strong>dateLastUpdated</strong></td>
<td><strong>35</strong></td>
<td><strong>recDateUpdated</strong></td>
</tr>
<tr>
<td>136</td>
<td>recAddressee</td>
<td>136</td>
<td>recAddresseeLoc</td>
</tr>
<tr>
<td>417</td>
<td>recAlternativeContainer</td>
<td>417</td>
<td>recAltContainer</td>
</tr>
<tr>
<td>140</td>
<td>recAlternativeContainers</td>
<td>140</td>
<td>recAltContainers</td>
</tr>
<tr>
<td>180</td>
<td>recAlternativeContents</td>
<td>180</td>
<td>recAltContents</td>
</tr>
<tr>
<td>52</td>
<td>recAssignee</td>
<td>52</td>
<td>recCurrentLoc</td>
</tr>
<tr>
<td>147</td>
<td>recAssigneeStatus</td>
<td>147</td>
<td>recCurrentLocationStatus</td>
</tr>
<tr>
<td>139</td>
<td>recAttachedKeywords</td>
<td>139</td>
<td>recTerms</td>
</tr>
<tr>
<td>135</td>
<td>recAuthor</td>
<td>135</td>
<td>recAuthorLoc</td>
</tr>
<tr>
<td>24</td>
<td>recClassOfRecord</td>
<td>24</td>
<td>recRcClass</td>
</tr>
<tr>
<td>58</td>
<td>recClient</td>
<td>58</td>
<td>recClientLoc</td>
</tr>
<tr>
<td>55</td>
<td>recCreator</td>
<td>55</td>
<td>recCreatorLoc</td>
</tr>
<tr>
<td>6</td>
<td>recDateRegistered</td>
<td>6</td>
<td>recDateReg</td>
</tr>
<tr>
<td>23</td>
<td>recDisposition</td>
<td>23</td>
<td>recCurrDisp</td>
</tr>
<tr>
<td>167</td>
<td>recDispositionSchedule</td>
<td>167</td>
<td>recPendingDispEvents</td>
</tr>
<tr>
<td>62</td>
<td>recDocumentDetails</td>
<td>62</td>
<td>recEDetails</td>
</tr>
<tr>
<td>61</td>
<td>recDocumentStatus</td>
<td>61</td>
<td>recEStatus</td>
</tr>
<tr>
<td>12</td>
<td>recExternalReference</td>
<td>12</td>
<td>recExternalId</td>
</tr>
<tr>
<td>20</td>
<td>recFilePath</td>
<td>20</td>
<td>recDOSfile</td>
</tr>
<tr>
<td>18</td>
<td>recHasLinkedDocuments</td>
<td>18</td>
<td>recHasLinks</td>
</tr>
<tr>
<td>54</td>
<td>recHomeLocation</td>
<td>54</td>
<td>recHomeLoc</td>
</tr>
<tr>
<td>420</td>
<td>recInitiateTemplate</td>
<td>420</td>
<td>recTemplate</td>
</tr>
<tr>
<td>57</td>
<td>recIsEnclosed</td>
<td>57</td>
<td>recEnclosed</td>
</tr>
<tr>
<td>14</td>
<td>recIsInPartSeries</td>
<td>14</td>
<td>recIsPart</td>
</tr>
<tr>
<td>15</td>
<td>recIsRootOfPartSeries</td>
<td>15</td>
<td>recIsRoot</td>
</tr>
<tr>
<td><strong>122</strong></td>
<td><strong>recManualDestructionDate</strong></td>
<td><strong>117</strong></td>
<td><strong>recDestructionDate</strong></td>
</tr>
<tr>
<td>112</td>
<td>recNewPartCreationRule</td>
<td>112</td>
<td>recAutoPartRule</td>
</tr>
<tr>
<td>138</td>
<td>recOtherContact</td>
<td>138</td>
<td>recOtherLoc</td>
</tr>
<tr>
<td>53</td>
<td>recOwnerLocation</td>
<td>53</td>
<td>recOwnerLoc</td>
</tr>
<tr>
<td>56</td>
<td>recPrimaryContact</td>
<td>56</td>
<td>recPrimaryContactLoc</td>
</tr>
<tr>
<td>81</td>
<td>recRenditionCount</td>
<td>81</td>
<td>recNumberRenditions</td>
</tr>
<tr>
<td>137</td>
<td>recRepresentative</td>
<td>137</td>
<td>recRepresentLoc</td>
</tr>
<tr>
<td>101</td>
<td>recRetentionSchedule</td>
<td>101</td>
<td>recRetSchedule</td>
</tr>
<tr>
<td>144</td>
<td>recTopLevelActions</td>
<td>144</td>
<td>recTopActions</td>
</tr>
</tbody>
</table>

I assume the names were changed to be a bit more human readable - perhaps to make it easier when configuring the TRIM SharePoint integration. But in applications where I don't want to maintain a different TRIM 6 or TRIM 7 version (and where I rely on Properties), I've used a TRIM6 and TRIM7 Resource tables in my C# projects, and use one or the other by querying the `TRIMSDK.Database.SdkVersion` property.

And you can to!

_Matt_.