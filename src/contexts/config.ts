import ConfigStore from "@/utils/configStore";
import { createContext } from "react";

export const ConfigContext = createContext<{
    store: ConfigStore;
    config?: AviameterConfig;
    setConfig: (config: AviameterConfig) => void;
}>({
    store: new ConfigStore(),
    config: undefined,
    setConfig: () => {},
});
