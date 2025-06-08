import Link from "next/link";
import * as React from "react";

export default function Guide() {
    return (
        <div className="flex flex-col gap-2 w-fit mx-auto min-w-[20vw] md:px-10 px-3">
            <Link
                href="/"
                className="text-center text-blue-500 hover:underline"
            >
                ← Back to Home
            </Link>

            {/* Section: Importing Past Flight Data */}
            <h3 className="text-center border-b-1 text-xl border-black">
                Importing Past Flight Data
            </h3>
            <p>By importing past flight data, you can:</p>
            <ul className="list-disc pl-5">
                <li>See the flight path on the map</li>
                <li>Access to a real-time ETA in-flight</li>
            </ul>
            <p>
                You will require Internet connection to download previous flight
                data.
            </p>
            <h4 className="text-lg">How to Import</h4>
            <ul className="list-decimal pl-5">
                <li>
                    Go to&nbsp;
                    <Link
                        className="text-center text-blue-500 hover:underline"
                        href="https://flightaware.com/live/findflight/"
                    >
                        FlightAware
                    </Link>
                    &nbsp;and search for your flight.
                </li>
                <li>
                    Scroll down to &quot;View Track Log&quot; and click on it.
                </li>
                <li>
                    Click on the &quot;+ Google Earth&quot; button to download
                    the KML file.
                </li>
                <li>Import this file into Aviameter&apos;s configuration.</li>
            </ul>
            <p>
                Note: the ETA will be very inaccurate during take-off phase. It
                works the best while in cruise.
            </p>

            {/* Section: Using the App Offline */}
            <h3 className="text-center border-b-1 text-xl border-black">
                Using the App Offline
            </h3>
            <p>
                Aviameter is designed to work offline, allowing you to track
                your flight without an Internet connection.
                <br />
                When you first open the app, a notification will inform you that
                the app is ready to be used offline.
                <br />
                You may then access this app by typing the link
                (aviameter.sayato.xyz) directly in your browser under airplane
                mode.
            </p>
        </div>
    );
}
