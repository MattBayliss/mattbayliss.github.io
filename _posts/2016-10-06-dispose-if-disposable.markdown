---
layout: post
title: DisposeIfDisposable()
date: 2016-10-06 10:40:00
categories: c#
excerpt_separator: <!--more-->
---
I work primarily with <abbr title="Hewlett Packard Enterprise">HPE</abbr> <abbr title="Records Manager">RM</abbr>, and most of the the objects within its SDK needed to be Disposed (otherwise horrible memory related errors), prior to version 8.2 of RM.

So, lots of code like:

	Record record = null;
	try
	{
		record = new Record(trimDb, uri);
		//record code stuff
	}
	catch(Exception)
	{
		// error handling
	}
	finally
	{
		if(record != null)
		{
			record.Dispose();
		}
	}

Or, the nicer *`using`* shortcut:

	using (var record = new Record(trimDb, uri)) {
	   // code that uses record
	}

This all works because Record implements IDisposable. However, HPE RM 8.2 came along, and most objects no longer needed to be Disposed (which is a very good thing) and as such they no longer implemented IDisposable, which broke all the code shown above (not so good).

So, to make cross-version compatible code, I made the object extension, *DisposeIfDisposable*:

<!--more-->

	public static void DisposeIfDisposable(this object obj)
	{
		if(obj is IDisposable)
		{
			((IDisposable)obj).Dispose();
		}
	}
	
This extension will add a new `DisposeIfDisposable()` method to every object, and if that object is not null (`null is IDisposable` returns false), and implements IDisposable, it will be Disposed.	

I had to give up using `using`, which was sad. My cross-version-compatible code now looks like:

	Record record = null;
	try
	{
		record = new Record(trimDb, uri);
		//record code stuff
	}
	catch(Exception)
	{
		// error handling
	}
	finally
	{
		record.DisposeIfDisposable();
	}	

Hopefully that's of use to someone else other than me!

Matt.
