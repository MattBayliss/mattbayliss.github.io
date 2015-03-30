---
layout: post
title: "SetAsWebService &#8212; Using the TRIM .Net SDK in a web application"
date: 2011-10-27 16:22:30
categories: trimsdk
excerpt_separator: <!--more-->
---

If you've  been dabbling in the TRIM 7 .Net SDK, particularly as part of a web application you have to set TRIM to run in WebService (or Service) mode. This prevents any user interface shenanigans such as trying to display error windows on the server, and the storage of all TRIM users' caches in the one location, and other general server-mode goodness.

<!--more-->

So, the very first thing you should do in your code is tell TRIM that you'll be running in Web Service mode. For that you use the following static method:

`HP.HPTRIM.SDK.TrimApplication.SetAsWebService(@"C:\TrimWebServerWorkPath");`

Where C:\TrimWebServerWorkPath is the directory where I want all users' temporary data and cache to end up (and with all the appropriate Windows security permissions set to allow that - in my dev environments I'm lazy and set Everyone - Full Control).

But say you have that code as a constructor for a class, and you instantiate that class numerous times, as was the case for me when I was running my unit tests. The second time your application hits the TrimApplication.SetAsWebService line you'll get this lovely exception:

*System.ApplicationException: This application has already been initialised as either a Windows Service or a Web Service..*

So here's a quick tip - in your constructor do something like this instead:

{% highlight csharp %}
if (TrimApplication.ServiceType != ServiceTypes.WebService)
{
    TrimApplication.SetAsWebService(@"C:\TrimWebServerWorkPath");
}
{% endhighlight %}

Query the ServiceType beforehand to see if you've already set it, and say goodbye to annoying Exceptions!

Well, one of them.

_Matt_.