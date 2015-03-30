---
layout: post
date: 2009-10-22 10:50:42
title: Auto Categorisation Magic Happens
categories: information-management
excerpt_separator: <!--more-->
---

![unicorn](/images/unicorn-275x300.jpg)I'm all about trying to make managing information as easy as possible. And what could be easier than sneaky information management where the user doesn't have to do any extra work? I'm having troubles though. Not only because advanced text analysis algorithms are a tad beyond my skills (certainly to get anything working in my lifetime), but what will records management policy of an organisation let you get away with.

<!--more-->

For example, most information/records/document management systems prompt the user for some metadata when they want to store something into the system. What is the title? What security level should it have? Does it belong in a particular file/folder/container? Using Business Intelligence "magic", software could analyse a document on its way in and make "best guesses" on all of those things. Perhaps we could assume it's doing a good enough job store documents using that information without any user intervention at all. But some organisations require users to make a conscious decision on certain things, like security level, so that there's some accountability. Especially large government agencies that also hold your personal data - like the Tax Office.

So, if Tom McFakerson marks that letter as Unclassified when it contains Restricted information, Tom's in for some quiet talks behind closed doors. If the TryingToBeClever application makes a similar gaff, it's embarrassing for the whole organisation, and it's the implementor who is in trouble. Even just defaulting information to "best guesses" that the user then has to confirm could result in similar situations - when a screen pops up, interrupting what people are doing, they'll generally click OK to get it out of the way. If that happens enough times, it's the solution that's more at fault, not the individual.

Of course there's ways around it - quarantine all best-guessed information by locking it down completely until a dedicated approver can manually check each field and approve it. Or even better, only quarantine that information which the system had trouble categorising (a 60% certainty instead of a 95% for instance), and get that approved. Many spam filtering engines use the concept of "learning sets" ([Bayesian probability](http://en.wikipedia.org/wiki/Bayesian_probability)) - users tell the system when it's got it wrong, and the system "learns" and gets more accurate. In this way, hopefully, the person whose job it is to approve metadata gets more time to slack off and watch YouTube.

These thoughts aren't particularly original (both automated filing and slacking off to watch YouTube). With the massive amounts of information clogging up the intertubes, automatic classification/categorisation isn't new, and many companies out there are doing great things in helping people keep up with the deluge. In time our systems will store our information smarter, with less input required from us. Like when last night [Google Picasa](http://picasa.google.com/) scanned my computer and found and categorised photos by the faces it recognised (that's so cool! And a little frightening).

So, magic is happening, doing some boring and tedious work for us behind the scenes. I want to make some of that tedious magic happen! A Mage of Tediousity, that's me. Well, an apprentice.

I won't put that on my business card just yet.
