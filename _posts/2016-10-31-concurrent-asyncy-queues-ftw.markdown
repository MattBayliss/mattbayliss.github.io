---
layout: post
title: Concurrent Asyncy Queues FTW()
date: 2016-10-31 13:00:00
categories: c#
excerpt_separator: <!--more-->
---

I love C#, async/await tasks, and concurrency. That's just who I am.

I'm working on an ASP.Net MVC application, and I wanted to add a Rendering module that would generate HTML renditions of electronic attachments (i.e. Word documents, PDFs, Excel spreadsheets etc) so that they can be displayed in the browser. Using async/await and the System.Collections.Concurrent assembly in Microsoft.Net, specifically [ConcurrentDictionary][mscd] and ConcurrentQueue, I was able to create a thread-safe Rendering module that used a configurable number of threads to do the processing. Not sure if it's the best way to go about it, but it was a fun experiment.

Here's how I did it.

<!--more-->

(If you want to just look at the code, view it on GitHub: [github.com/MattBayliss/Concurrenty][ghlink])

System.Collections.Concurrent.ConcurrentDictionary has two interesting methods to add and remove items in a thread-safe way:

* `AddOrUpdate`: Adds a new value for the specified key, or if the the key already exists, replace it with the specified value.

* `GetOrAdd`: Retrieves an existing value for the specified key, or if the key isn't present, creates a new value with that key.

There are also the less cool boolean functions TryAdd, TryGetValue, TryUpdate and TryRemove that only do one thing, and return false if they fail.

*ConcurrentQueue* is fairly simple, with the standard `Enqueue` method to add items to the queue, and a boolean function, `TryDequeue` to attempt to remove an item from the queue.

So, let's design our Renderer class. It's only going to have a constructor and two public methods,

	public Renderer(int threadCount, Func<Request, CancellationToken, Task<Response>> renderFunc)

	public async Task<Response> Render(Request request, TimeSpan timeout)
	
	public void Stop()
	
## The constructor

The constructor accepts two arguments:

`int threadCount`: The number of threads on which to process Requests

`Func<Request, CancellationToken, Task<Response>> renderFunc`: A delegate function that does the Rendering. It accepts a `Request` object (defined below), a `CancellationToken`, used to abort the Render, and returns a `Response` object (defined below).

This allows us to reuse our Renderer class for any kind of multithreaded queue processing. We just pass in a different renderFunc for whatever purpose.

## Render function

This async await function accepts the request, and a timeout value, and returns a Response, unless the timeout value is reached, and then a TimeoutException will be thrown.

## Stop method

Calling this will stop all Render threads, and the queue from processing. Currently this stops the Renderer dead, and it's meant to be run as part of the shutdown code of the parent application. It will request a cancellation on the CancellationToken passed to the renderFunc defined in the constructor. But more on that later.

## Request and Response objects

For this example, the Request and Response classes are very basic, and you can change them for your purposes. The Request just contains a unique Id property of the attachment to be rendered, and the Reponse a boolean indicating success or failure, and the Filename of the rendered HTML file.


	public class Request
    {
        public int Id { get; set; }
    }
	
	public class Response
	{
		public bool Success { get; set; }
		public string Filename { get; set; }
	}

## Proposed usage

Here's how our Renderer class will be used - let's make a async function that given an array of record Ids, sends Requests to our Renderer, and returns a dictionary of the record Ids and their associated Responses.

	public async Task<Dictionary<int, Response>> RenderToThumbnails(int[] recordIds)
	{
		var responsesById = new Dictionary<int, Response>();

		var renderer = new Renderer(20, RenderRequest);

		var timeout = TimeSpan.FromSeconds(30);

		// easy LINQ way of converting the record Ids into Requests.
		var requests = recordIds.Distinct().Select(id => new Request { Id = id });

		foreach (var request in requests) {
			Response response = null;
			try
			{
				response = await renderer.Render(request, timeout);
			}
			catch (TimeoutException)
			{
				// timeout reached
			}
			responsesById.Add(request.Id, response);
		}

		return responsesById;
	}

	private static async Task<Response> RenderRequest(Request request, CancellationToken ct)
	{
		Console.WriteLine("{0}: Render Started", request.Id);

		// Here would be the heavy lifting of transforming a request into a response.
		// We'll just wait a random time between 2 and 20 seconds
		var random = new Random().Next(2000, 20000);
		await Task.Delay(random, ct);
		if(ct.IsCancellationRequested)
		{
			Console.WriteLine("{0}: Render cancelled", request.Id);
			return null;
		}

		Console.WriteLine("{0}: Render Finished", request.Id);

		return new Response
		{
			Filename = Path.GetTempFileName(),
			Success = true
		};

	}
	
This is a contrived example for illustrative purposes. RenderToThumbnails has us awaiting each Render for each Request in turn, whereas we could have used await Task.WhenAll to wait for all requests to complete, regardless of order. The [code on github][ghlink] shows Task.WhenAll is use.
	
## How the Renderer	works

The Render function adds requests to the `ConcurrentQueue<Request> _requestQueue`. This is a thread-safe queue, that multiple threads can add Requests to safely.

The function `private async Task ProcessQueue(CancellationToken ct)` assigns each Request to a Task, making use of the GetOrAdd method of ConcurrentDictionary. Using the dictionary defined as `ConcurrentDictionary<int, Task<Response>> _responseTasks`, the Renderer allocates requests to the task array as follows:

	tasks[t] = _responseTasks.GetOrAdd(request.Id, _renderFunc(request, ct));
	
What this means that the key, request.Id doesn't exist in `_responseTasks` then start the `renderFunc` for that request. However if that request has already been assigned to the dictionary, use the existing `renderFunc` already added to the `_responseTasks` dictionary. Neat, huh?

ProcessQueue completes when all queued requests are assigned to tasks in the `_responseTasks` dictionary (not when those tasks are completed). Requests are removed from the _requestQueue using the TryDequeue method, which tries to get a Request from the queue in a thread-safe way. If it fails (returns false), it waits 100ms and checks the queue again.

When Render is called, the Request in added to the _requestQueue, Render then awaits the ProcessQueue task, which will ensure that the request Id has been assigned a `renderFunc` in the `_responseTasks` dictionary, and then it's just a matter of awaiting the `Task<Response>` value of `_responseTasks[request.Id]', with some timeout handling code added in.

The `Stop()` method triggers the stop token, defined as `private CancellationTokenSource _stopToken`. This token is passed throughout the Render and ProcessQueue functions, so that if Stop is called, all Render tasks end, the ProcessQueue exits straight away, and everything cleans up nicely, assuming you handle the `CancellationToken` parameter in your renderFunc nicely.

Below is the Renderer code, which hopefully illuminates what I've just explained, or vice-versa. A full console app that runs some fake requests is [available on GitHub][ghlink].

So, not sure it's the best way of going about things, but it was a fun exercise.

Happy coding!

Matt.

	using System;
	using System.Collections.Concurrent;
	using System.Linq;
	using System.Threading;
	using System.Threading.Tasks;

	namespace Concurrenty
	{
		public class Renderer
		{
			private Task _processQueueTask;
			private ConcurrentQueue<Request> _requestQueue;
			private ConcurrentDictionary<int, Task<Response>> _responseTasks;
			private int _threadCount;
			private CancellationTokenSource _stopToken;
			private readonly static object QueueLock = new object();
			private Func<Request, CancellationToken, Task<Response>> _renderFunc;

			public Renderer(int threadCount, Func<Request, CancellationToken, Task<Response>> renderFunc)
			{
				_threadCount = threadCount;
				_renderFunc = renderFunc;

				_processQueueTask = null;
				_requestQueue = new ConcurrentQueue<Request>();
				_responseTasks = new ConcurrentDictionary<int, Task<Response>>();
				_stopToken = new CancellationTokenSource();
			}

			public void Stop()
			{
				_stopToken.Cancel();
			}

			public async Task<Response> Render(Request request, TimeSpan timeout)
			{
				await EnqueueRequestAndStartProcessing(request, _stopToken.Token);
				//request should now be registered

				if(_stopToken.Token.IsCancellationRequested)
				{
					return null;
				}

				Task<Response> responseTask;
				if (!_responseTasks.TryRemove(request.Id, out responseTask))
				{
					throw new ApplicationException("Failed to process");
				};

				if (responseTask == await Task.WhenAny(responseTask, Task.Delay(timeout, _stopToken.Token)))
				{
					return await responseTask;
				}
				else
				{
					Console.WriteLine("{0}: Render failed to complete in a timely fashion", request.Id);
					return null;
				}
			}

			private async Task EnqueueRequestAndStartProcessing(Request request, CancellationToken ct)
			{
				_requestQueue.Enqueue(request);

				if ((_processQueueTask == null) || (_processQueueTask.IsCompleted))
				{
					_processQueueTask = ProcessQueue(ct);
				}
				await _processQueueTask;
			}

			private async Task ProcessQueue(CancellationToken ct)
			{
				Console.WriteLine(">>> PROCESSING QUEUE");

				// allow 3 seconds between processing so the queue can fill up a bit
				await Task.Delay(3000, ct);

				var tasks = new Task[_threadCount];

				// tasks index
				var t = 0;

				// while there are requests in the queue, cycle through our tasks array to see if there's a spot free in our "Task pool"
				while (!_requestQueue.IsEmpty && !ct.IsCancellationRequested)
				{
					Request request;
					if (_requestQueue.TryDequeue(out request))
					{
						Console.WriteLine("{0}: request dequeued", request.Id);
						bool allocatedToTask = false;
						while (!allocatedToTask && !ct.IsCancellationRequested)
						{
							// find a free spot, starting at the last task assigned (t)
							for (int i = 0; i < _threadCount; i++)
							{
								t = (t + i) % _threadCount;
								if ((tasks[t] == null) || (tasks[t].IsCompleted))
								{
									allocatedToTask = true;
									tasks[t] = _responseTasks.GetOrAdd(request.Id, _renderFunc(request, ct));
									Console.WriteLine("{0}: request allocated to task {1}", request.Id, t);
									break;
								}
							}
							if (!allocatedToTask && !ct.IsCancellationRequested)
							{
								Console.WriteLine("WAITING FOR A FREE TASK...");
								// all tasks are busy, need to wait for one to become available
								await Task.WhenAny(tasks);
							}
						}
					}
					else
					{
						Console.WriteLine(">>> failed to dequeue request - waiting 100ms");
						await Task.Delay(100);
					}
				}
				// queue is empty - all requests processed. Wait for the results
				Console.WriteLine(">>> QUEUE CLEARED");
				await Task.WhenAll(tasks.Where(task => task != null));
			}               
		}
	}


[mscd]: https://msdn.microsoft.com/en-us/library/dd997369(v=vs.110).aspx "How to: Add and Remove Items from a ConcurrentDictionary"
[ghlink]: https://github.com/MattBayliss/Concurrenty "GitHub repository MattBayliss/Concurrenty"
