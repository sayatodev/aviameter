"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { ArrowUpDown, Settings2 } from "lucide-react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConfigContext } from "@/contexts/config";
import { Button } from "./ui/button";
import { AirportInput } from "./AirportInput";
import z from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField } from "./ui/form";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { KMLParser } from "@/utils/kmlParser";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { CacheModal } from "./CacheModal";

const configFormSchema = z.object({
    departureAirport: z
        .string()
        .min(3, "IATA code must be at least 3 characters")
        .optional()
        .or(z.literal("")),
    arrivalAirport: z
        .string()
        .min(3, "IATA code must be at least 3 characters")
        .optional()
        .or(z.literal("")),
    referenceTrack: z.object({
        name: z.string(),
        file: z.instanceof(File).optional(),
    }),
    mapOverlayShown: z.boolean(),
    units: z.enum(["metric", "aviation"]),
});
export type ConfigFormSchema = z.infer<typeof configFormSchema>;

export function ConfigModal() {
    const formRef = useRef<HTMLFormElement>(null);
    const [open, setOpen] = useState(false);
    const { config, setConfig, store } = useContext(ConfigContext);

    /* Form */
    const form = useForm<z.infer<typeof configFormSchema>>({
        resolver: zodResolver(configFormSchema),
        defaultValues: {
            departureAirport: config?.departureAirport,
            arrivalAirport: config?.arrivalAirport,
            referenceTrack: {
                name: config?.referenceTrack?.name ?? "(None)",
            },
            mapOverlayShown: config?.mapOverlayShown ?? false,
            units: config?.units ?? "aviation",
        },
    });

    function onSubmit(values: z.infer<typeof configFormSchema>) {
        console.log("Form submitted with values:", values);
        const newConfig: AviameterConfig = {
            departureAirport: values.departureAirport,
            arrivalAirport: values.arrivalAirport,
            referenceTrack: {
                name: values.referenceTrack.name,
                flightPath: {
                    trackPoints: [],
                },
            },
            mapOverlayShown: values.mapOverlayShown,
            units: values.units,
        };
        if (values.referenceTrack.file) {
            // Wait for file to be processed
            KMLParser.processFile(values.referenceTrack.file).then(
                (track) => {
                    newConfig.referenceTrack.flightPath.trackPoints = track;
                    setConfig(newConfig);
                    store.setConfig(newConfig);
                    setOpen(false);
                },
                (error) => {
                    console.error("Error processing KML file:", error);
                    toast.error("Could not process KML file", {
                        className: "z-1011",
                        action: {
                            label: "View guide",
                            onClick: () => {
                                window.open("/guide", "_blank")?.focus();
                            },
                        },
                        position: "top-center",
                    });
                },
            );
        } else {
            // No files to process
            newConfig.referenceTrack.flightPath.trackPoints = [];
            setConfig(newConfig);
            store.setConfig(newConfig);
            setOpen(false);
        }
    }

    useEffect(() => {
        form.setValue("departureAirport", config?.departureAirport);
        form.setValue("arrivalAirport", config?.arrivalAirport);
        form.setValue(
            "referenceTrack.name",
            config?.referenceTrack?.name ?? "(None)",
        );
        form.setValue("mapOverlayShown", config?.mapOverlayShown ?? false);
        form.setValue("units", config?.units ?? "aviation");
    }, [config, form]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Form {...form}>
                <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogTrigger asChild className="ml-auto cursor-pointer">
                        <Settings2 />
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] z-1010">
                        <DialogHeader>
                            <DialogTitle>Configurations</DialogTitle>
                        </DialogHeader>
                        <Accordion
                            type="multiple"
                            className="w-full min-w-0 max-h-[calc(100vh-200px)] overflow-y-auto"
                        >
                            <AccordionItem value="flight-route" className="m-1">
                                <AccordionTrigger className="text-lg focus-visible:ring-0 focus-visible:bg-slate-200 focus-visible:px-2">
                                    Flight Route
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-3">
                                    <div className="min-w-0">
                                        <FormField
                                            control={form.control}
                                            name="departureAirport"
                                            render={({ field }) => (
                                                <AirportInput
                                                    label="Departure Airport"
                                                    field={field}
                                                    form={form}
                                                />
                                            )}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-fit mx-auto"
                                        onClick={() => {
                                            const temp =
                                                form.getValues(
                                                    "departureAirport",
                                                );
                                            form.setValue(
                                                "departureAirport",
                                                form.getValues(
                                                    "arrivalAirport",
                                                ),
                                            );
                                            form.setValue(
                                                "arrivalAirport",
                                                temp,
                                            );
                                        }}
                                    >
                                        <ArrowUpDown />
                                        Swap
                                    </Button>
                                    <div className="min-w-0">
                                        <FormField
                                            control={form.control}
                                            name="arrivalAirport"
                                            render={({ field }) => (
                                                <AirportInput
                                                    label="Arrival Airport"
                                                    field={field}
                                                    form={form}
                                                />
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem
                                value="reference-track"
                                className="m-1"
                            >
                                <AccordionTrigger className="text-lg focus-visible:ring-0 focus-visible:bg-slate-200 focus-visible:px-2">
                                    Reference Track
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-3">
                                    <FormField
                                        control={form.control}
                                        name="referenceTrack.file"
                                        render={({
                                            field: {
                                                value: _value,
                                                onChange,
                                                ...fieldProps
                                            },
                                        }) => (
                                            <div>
                                                <Label htmlFor="referenceTrackFileInput">
                                                    Import File
                                                </Label>
                                                <Input
                                                    {...fieldProps}
                                                    id="referenceTrackFileInput"
                                                    type="file"
                                                    accept=".kml"
                                                    className="cursor-pointer"
                                                    onChange={(event) => {
                                                        onChange(
                                                            event.target
                                                                .files &&
                                                                event.target
                                                                    .files[0],
                                                        );
                                                    }}
                                                />
                                            </div>
                                        )}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem
                                value="display-options"
                                className="m-1"
                            >
                                <AccordionTrigger className="text-lg focus-visible:ring-0 focus-visible:bg-slate-200 focus-visible:px-2">
                                    Display Options
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-3">
                                    <FormField
                                        control={form.control}
                                        name="mapOverlayShown"
                                        render={({
                                            field: { value, onChange },
                                        }) => (
                                            <div className="flex items-center space-x-2">
                                                <div className="flex items-center space-x-2">
                                                    <FormControl>
                                                        <Switch
                                                            checked={value}
                                                            onCheckedChange={
                                                                onChange
                                                            }
                                                        />
                                                    </FormControl>
                                                    <Label htmlFor="mapOverlayShown">
                                                        Map overlay
                                                    </Label>
                                                </div>
                                            </div>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="units"
                                        render={({ field }) => (
                                            <div className="flex items-center space-x-2">
                                                <Label htmlFor="units">
                                                    Units
                                                </Label>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select unit system..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="z-1011">
                                                        <SelectItem value="aviation">
                                                            Aviation (knots,
                                                            feet)
                                                        </SelectItem>
                                                        <SelectItem value="metric">
                                                            Metric (km/h,
                                                            meters)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="cache" className="m-1">
                                <AccordionTrigger className="text-lg focus-visible:ring-0 focus-visible:bg-slate-200 focus-visible:px-2">
                                    Cache
                                </AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-3">
                                    <CacheModal />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                onClick={() => {
                                    if (formRef.current) {
                                        formRef.current.dispatchEvent(
                                            new Event("submit", {
                                                bubbles: true,
                                            }),
                                        );
                                    }
                                }}
                            >
                                Save changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </form>
            </Form>
        </Dialog>
    );
}
