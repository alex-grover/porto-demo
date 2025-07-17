import { Dialog, Mode } from "porto";
import { porto } from "porto/wagmi";
import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    porto({
      mode: Mode.dialog({
        renderer: Dialog.popup(),
      }),
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});
