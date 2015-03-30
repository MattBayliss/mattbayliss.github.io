---
layout: post
title: HP TRIM Stream Record Attachment Web Application
date: 2012-05-22 15:33:01
categories: trimsdk
excerpt_separator: <!--more-->
---

[CodePlex: HP TRIM Stream Record Attachment Web App](http://viewhptrimrecord.codeplex.com/)

Been reading a lot of development blogs lately and realised I still had one.

I've had in my possession for the longest time some source code that was originally published by Tower Software (prior to it being purchased by HP in 2008) to stream a TRIM electronic record to a browser. I recently updated it to use MVC style routing (thanks to: [4 Guys from Rolla*](http://www.4guysfromrolla.com/articles/012710-1.aspx "4 Guys from Rolla: URL Routing in ASP.NET 4")).

<!--more-->

So, you just copy the source code onto an IIS web server with the TRIM client installed, do some configuration, and you can then have links like:
http://fakeaddressdontclick/View/D12/345
Where D12/345 is a record number, and assuming record D12/345 has an electronic attachment, it will be streamed to your browser. It's great for organisations to send around links like this rather than electronic attachments, for at least two obvious reasons:

1. Attachments fill up mailbox space
2. The link will always get you the latest revision of the record

Now extending the web app to allow Edits (ie /Edit/D12/345) is a whole other bag of flesh eating bacteria, but you could totally use this as a basis for a REST web service to GET/PUT/POST/DELETE etc electronic records and their revisions and renditions.

I added the code to CodePlex (my very first CodePlex project! It was really simple to create one too). Do what you like with it!

[http://viewhptrimrecord.codeplex.com/](http://viewhptrimrecord.codeplex.com/ "CodePlex: HP TRIM Stream Record Attachment Web App")

*I think I've been getting help from 4 Guys From Rolla for well over a decade - are they that old? Am I? The answer to the second question is: Yes.