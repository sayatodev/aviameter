"use client";

import { useContext } from "react";

import { AirportsContext } from "@/contexts/airports";
import type { ControllerRenderProps } from "react-hook-form";
import { FormItem, FormLabel, FormMessage } from "./ui/form";
import type { useForm } from "react-hook-form";
import type { ConfigFormSchema } from "./ConfigModal";
import { VirtualizedCombobox } from "./VirtualizedCombobox";

interface IAirportInputProps {
    field: ControllerRenderProps<
        ConfigFormSchema,
        `${"departure" | "arrival"}Airport`
    >;
    form: ReturnType<typeof useForm<ConfigFormSchema>>;
    label: string;
}

export function AirportInput({ label, field, form }: IAirportInputProps) {
    const airports = useContext(AirportsContext);

    return (
        <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
            <VirtualizedCombobox<ConfigFormSchema>
                options={airports.map((airport) => ({
                    value: airport.key,
                    ...airport,
                }))}
                field={field}
                form={form}
                searchPlaceholder="Search airports..."
            />
            <FormMessage />
        </FormItem>
    );
}
