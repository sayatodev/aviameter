import * as React from "react";
import { Menu } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { ConfigModal } from "./ConfigModal";

export function Header() {
    return (
        <header className="bg-slate-600 text-white p-4 shadow-lg grid grid-cols-8 gap-4 rounded-b-2xl -mb-2 fixed w-full z-1000">
            <Sheet>
                <SheetTrigger asChild className="cursor-pointer">
                    <Menu />
                </SheetTrigger>
                <SheetContent side="left" className="z-1020">
                    <SheetHeader className="font-bold">
                        <SheetTitle>Aviameter</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col items-start px-4 gap-4">
                        <Link href="/" className="text-xl font-bold">
                            Home
                        </Link>
                        <Link href="/guide" className="text-xl font-bold">
                            Guide
                        </Link>
                        <Link
                            href="#"
                            className="text-xl font-bold text-slate-500"
                        >
                            Taxiway Map (HKG)
                            <br />
                            <span className="text-sm">(Coming soon)</span>
                        </Link>
                    </div>
                    <SheetFooter className="text-sm text-slate-600">
                        <Link href="https://github.com/sayatodev/aviameter">
                            View source on Github
                        </Link>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <h1 className="col-span-6 text-center">Aviameter</h1>

            <ConfigModal />
        </header>
    );
}
