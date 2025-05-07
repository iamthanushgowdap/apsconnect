"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button'; // Assuming Button component for consistency if needed later

export default function FeedPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto my-10 max-w-lg rounded-xl border border-border bg-card px-4 py-8 shadow-lg">
        <div className="mb-4 flex justify-between border-b border-border pb-3">
          <p className="text-xl font-bold text-foreground">Activity feed</p>
          {/* Placeholder for Notification Settings button functionality */}
          <button className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-ring">
            Notification Settings
          </button>
        </div>
        <div>
          {/* Activity Item 1: Liked Comment */}
          <div className="mb-3 space-y-4 py-2 focus:outline-none focus:ring-1 focus:ring-ring" tabIndex={0}>
            <div className="relative flex items-center">
              <Image
                className="h-10 w-10 rounded-full object-cover"
                src="https://picsum.photos/40/40"
                alt="Johanson Levinsiki"
                width={40}
                height={40}
                data-ai-hint="person avatar"
              />
              <div className="ml-4 flex flex-col sm:w-96">
                <p className="mb-1 font-medium text-foreground">Johanson Levinsiki</p>
                <div className="text-sm text-muted-foreground">
                  <span className="shrink-0 mr-1 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="inline h-3 w-3">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                  </span>
                  <span className="mr-1 font-medium text-red-500">liked your comment:</span>
                  <span className="">Lorem ipsum dolor sit amet, consectetur adipisicing elit.</span>
                </div>
              </div>
              <span className="absolute top-0 right-2 text-sm text-muted-foreground">1min ago</span>
            </div>
          </div>

          {/* Activity Item 2: Replied to Comment */}
          <div className="mb-3 space-y-4 py-2 focus:outline-none focus:ring-1 focus:ring-ring" tabIndex={0}>
            <div className="relative flex items-center">
              <Image
                className="h-10 w-10 rounded-full object-cover"
                src="https://picsum.photos/40/41" // Slightly different to get a new image
                alt="Johanson Levinsiki"
                width={40}
                height={40}
                data-ai-hint="person avatar"
              />
              <div className="ml-4 flex flex-col sm:w-96">
                <p className="mb-1 font-medium text-foreground">Johanson Levinsiki</p>
                <div className="mb-2 text-sm text-muted-foreground">
                  <span className="shrink-0 mr-1 text-primary"> {/* Changed to primary based on theme */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="inline h-3 w-3">
                      <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                      <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                    </svg>
                  </span>
                  <span className="mr-1 font-medium text-primary">replied to your comment:</span> {/* Changed to primary */}
                  <span className="">Lorem ipsum dolor sit amet, consectetur adipisicing elit.</span>
                </div>
                <div className="rounded-xl bg-primary/10 p-4 text-muted-foreground"> {/* Adjusted background */}
                  <p className="text-sm">Lorem ipsum dolor, sit amet consectetur adipisicing elit. Rerum, soluta modi? Amet, sequi distinctio.</p>
                </div>
              </div>
              <span className="absolute top-0 right-2 text-sm text-muted-foreground">1min ago</span>
            </div>
          </div>

          {/* Activity Item 3: Shared a File */}
          <div className="mb-3 space-y-4 py-2 focus:outline-none focus:ring-1 focus:ring-ring" tabIndex={0}>
            <div className="relative flex items-center">
              <Image
                className="h-10 w-10 rounded-full object-cover"
                src="https://picsum.photos/40/42" // Slightly different to get a new image
                alt="Johanson Levinsiki"
                width={40}
                height={40}
                data-ai-hint="person avatar"
              />
              <div className="ml-4 flex flex-col sm:w-96">
                <p className="mb-1 font-medium text-foreground">Johanson Levinsiki</p>
                <div className="mb-2 text-sm text-muted-foreground">
                  <span className="shrink-0 mr-1 text-primary"> {/* Changed to primary */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="inline h-3 w-3">
                      <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="mr-1 font-medium text-primary">shared a file</span> {/* Changed to primary */}
                </div>
                <div className="rounded-xl bg-primary/10 p-4 text-muted-foreground"> {/* Adjusted background */}
                  <div className="flex items-center">
                    <span className="text-primary"> {/* Changed to primary */}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </span>
                    <div className="ml-4 pr-10">
                      <p className="mb-1 text-sm font-medium text-foreground">Earnings Report 2021 | Berkshire Hathaway Inc</p>
                      <p className="text-xs text-muted-foreground">
                        512KB
                        <a className="ml-1 text-primary hover:underline" href="#"> {/* Changed to primary */}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="inline h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <span className="absolute top-0 right-2 text-sm text-muted-foreground">1min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
