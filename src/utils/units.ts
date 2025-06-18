// All values are in SI units

export const M_to_NM = (x: number) => x * 0.000539957;
export const M_to_FT = (x: number) => x * 3.28084;
export const M_to_KM = (x: number) => x * 0.001;
export const MPS_to_KTS = (x: number) => x * 1.94384449;
export const MPS_to_FPM = (x: number) => x * 196.8503937;
export const MPS_to_Mach = (x: number) => x / 340.29;

class Measurement {
    value: number;
    SI_unit: string;

    constructor(value: number, SI_unit: string) {
        this.value = value;
        this.SI_unit = SI_unit;
    }

    SI(precision = 2): number {
        return parseFloat(this.value.toFixed(precision));
    }

    toString(): string {
        return `${this.SI(4)} ${this.SI_unit}`;
    }
}

export class Length extends Measurement {
    constructor(value: number) {
        super(value, "m");
    }

    ft(precision = 2): number {
        return parseFloat(M_to_FT(this.value).toFixed(precision));
    }

    nm(precision = 2): number {
        return parseFloat(M_to_NM(this.value).toFixed(precision));
    }

    km(precision = 2): number {
        return parseFloat(M_to_KM(this.value).toFixed(precision));
    }

    to(unit: LengthUnit, precision = 2): number {
        switch (unit) {
            case LengthUnit.Meters:
                return this.SI(precision);
            case LengthUnit.Feet:
                return this.ft(precision);
            case LengthUnit.NauticalMiles:
                return this.nm(precision);
            case LengthUnit.Kilometers:
                return this.km(precision);
            default:
                throw new Error(`Unsupported length unit: ${unit}`);
        }
    }
}

export enum LengthUnit {
    Meters,
    Feet,
    NauticalMiles,
    Kilometers,
}

export class Speed extends Measurement {
    constructor(value: number) {
        super(value, "m/s");
    }

    kts(precision = 2): number {
        return parseFloat(MPS_to_KTS(this.value).toFixed(precision));
    }

    fpm(precision = 2): number {
        return parseFloat(MPS_to_FPM(this.value).toFixed(precision));
    }

    mach(precision = 2): number {
        return parseFloat(MPS_to_Mach(this.value).toFixed(precision));
    }

    to(unit: SpeedUnit, precision = 2): number {
        switch (unit) {
            case SpeedUnit.MetersPerSecond:
                return this.SI(precision);
            case SpeedUnit.Knots:
                return this.kts(precision);
            case SpeedUnit.FeetPerMinute:
                return this.fpm(precision);
            case SpeedUnit.Mach:
                return this.mach(precision);
            default:
                throw new Error(`Unsupported speed unit: ${unit}`);
        }
    }
}

export enum SpeedUnit {
    MetersPerSecond,
    Knots,
    FeetPerMinute,
    Mach,
}
