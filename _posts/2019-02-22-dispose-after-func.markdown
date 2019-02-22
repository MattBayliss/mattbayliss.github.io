---
layout: post
title: DisposeAfterFunc()
date: 2019-02-22 13:12:00
categories: c#
---
I'm been working a lot with anonymous Functions and Actions in C# - putting functional programming thinking into my code where I can. This caused me to revisit my [DisposeIfDisposable][didlink] code. As a reminder, I had the code:


	public static void DisposeIfDisposable(this object obj)
	{
		if(obj is IDisposable)
		{
			((IDisposable)obj).Dispose();
		}
	}
	
I needed this function because the 3rd party libraries I use sometimes implement IDisposable and sometimes not depending on the version installed (read all about it in [that blog post][didlink]). I would use it as follows:	
	

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

I was ending up with so much repeated code however. Everything started with

	SomeObject someObj = null;
	try
	{
		someObj = // a constructor or factory call to instantiate the initial value;		
		// some code here that worked with someObj.
	}
	catch(Exception)
	{
		// error handling
	}
	finally
	{
		someObj.DisposeIfDisposable();
	}	
	
With all that repeated initialise, try, catch, finally, I thought of a cleaner way to do it with dynamic types and anonymous functions. BEHOLD!

	public static T DisposeAfterFunc<S, T>(Func<S> initObjectFunc, Func<S, T> usingFunc, Action<Exception> errorHandler = null)
	{
		object disposeObject = null;
		try
		{
			disposeObject = initObjectFunc();
			return usingFunc((S)disposeObject);
		}
		catch (Exception ex)
		{
			if (errorHandler != null)
			{
				errorHandler(ex);
			}
			else
			{
				throw;
			}
		}
		finally
		{
			disposeObject.DisposeIfDisposable();
		}
		return default(T);
	}
	
I'll show an example with some proper code below, but first some details. This DisposeAfterFunc takes 3 parameters:

Func<S> initObjectFunc
----------------------

This is the function that provides the initial value of type S for our object. I'm passing it as a Func<S> instead of just S itself, so that the initialisation is covered by the try / catch. 

Func<S, T> usingFunc
--------------------

This anonymous function takes the value returned by initObjectFunc, does whatever needs to be done, and returns a value of type T. 

Action<Exception> errorHandler
------------------------------

This is an optional anonymous error handler Action. If this parameter is null, the Exception is thrown to the calling function. If the errorHandler isn't null, but doesn't stop execution, the function would return a default(T) - which is always null with the 3rd party objects I use.

So, some examples! Here's a function that performs a search, and returns a List<string> of unique identifiers:


	private IEnumerable<string> GetResultUrisForQuery(Database trimDb, string trimQuery)
	{
		return DisposeAfterFunc(
			() => TrimMainObjectSearch(trimDb, BaseObjectTypes.Record),
			(search) =>
			{
				search.SetSearchString(trimQuery);
				return search
					.GetResultAsUriArray()
					.Select(u => u.ToString())
					.ToList();
			}
			);            
	}	

This code initialises an object with the function TrimMainObjectSearch(trimDb, BaseObjectTypes.Record) - which makes S a TrimMainObjectSearch in this example. The usingFunc,


	(search) =>
	{
		search.SetSearchString(trimQuery);
		return search
			.GetResultAsUriArray()
			.Select(u => u.ToString())
			.ToList();
	}

returns a List<string> value, so T is List<string>. No errorHandler is provided, so the error is caught higher in the call stack.

Here's a smaller sample - wanting to instantiate my TrimLocation Author property (T) with the 3rd party HP.TRIMSDK.Location object (S), and log any errors encountered (I'm using NLog):	

	Author = DisposeAfterFunc(
		() => record.Author,
		(author) => new TrimLocation(author),
		(e) => Logger.Trace(e, "Error setting Author");

I have mixed feelings about the result. While the DisposeAfterFunc follows the <abbr title="Don't Repeat Yourself">DRY</abbr> principle, and I think it's neat, the end result is a bit harder to read and understand that a try - catch - finally block.		

It did reduce a lot of lines of code though...

Matt.
		
	
[didlink]: /c%23/2016/10/06/dispose-if-disposable.html
