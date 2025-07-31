import { Dialog, Mode } from "porto";
import { baseSepolia } from "porto/Chains";
import { porto } from "porto/wagmi";
import { http, createConfig } from "wagmi";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    porto({
      mode: ["preview", "production"].includes(
        process.env.NEXT_PUBLIC_VERCEL_ENV!,
      )
        ? undefined
        : Mode.dialog({
            renderer: Dialog.popup(),
          }),
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});
