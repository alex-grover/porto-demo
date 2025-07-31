import {
  CircleUserRoundIcon,
  PictureInPicture2Icon,
  Trash2Icon,
} from "lucide-react";
import { P256, Provider, PublicKey, Value } from "ox";
import { Hooks } from "porto/wagmi";
import { FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { BaseError, UserRejectedRequestError } from "viem";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { exp1Config } from "@/lib/contracts";

const tiers = [
  { amount: Value.fromEther("2"), unit: "week" },
  { amount: Value.fromEther("7"), unit: "month" },
  { amount: Value.fromEther("75"), unit: "year" },
] as const;

const formatter = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 4,
});

export function format(num: bigint | number | undefined, units = 18) {
  if (!num) return "0";
  return formatter.format(
    typeof num === "bigint" ? Number(Value.format(num, units)) : num,
  );
}

export function Subscribe() {
  const {
    data: permissions,
    refetch: refetchPermissions,
    ...other
  } = Hooks.usePermissions();
  console.log({ permissions, ...other });
  const grantPermissions = Hooks.useGrantPermissions();
  const revokePermissions = Hooks.useRevokePermissions({
    mutation: {
      onError(err) {
        const error = (() => {
          if (err instanceof BaseError)
            return err instanceof BaseError
              ? err.walk((err) => err instanceof UserRejectedRequestError)
              : err;
          return err;
        })();

        if (
          (error as Provider.ProviderRpcError)?.code !==
          Provider.UserRejectedRequestError.code
        )
          toast.error("Subscribe Failed", {
            description: err?.message ?? "Something went wrong",
          });
      },
      async onSuccess() {
        try {
          await refetchPermissions();
          setId(undefined);
        } catch {}
      },
    },
  });
  const [id, setId] = useState<string | undefined>();
  const subscriptionAddress = "0x0000000000000000000000000000000000000000";
  const permission = permissions?.find((permission) =>
    id
      ? permission.id === id
      : permission.permissions.spend?.some(
          (spend) => spend.token === subscriptionAddress,
        ),
  );
  const activeTier = permission?.permissions?.spend?.at(-1);
  const activeTierIndex = tiers.findIndex(
    (tier) => tier.unit === activeTier?.period,
  );

  const [selectedTier, setSelectedTier] =
    useState<(typeof tiers)[number]["unit"]>("month");

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      async function submit() {
        try {
          const tier = tiers.find((tier) => tier.unit === selectedTier);
          if (!tier) throw new Error(`Invalid tier: ${selectedTier}`);

          const privateKey = P256.randomPrivateKey();
          const publicKey = PublicKey.toHex(P256.getPublicKey({ privateKey }), {
            includePrefix: false,
          });
          const res = await grantPermissions.mutateAsync({
            expiry: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
            feeLimit: {
              currency: "USD",
              value: "1",
            },
            key: { publicKey, type: "p256" },
            permissions: {
              calls: [{ to: subscriptionAddress }],
              spend: [
                {
                  limit: tier.amount,
                  period: selectedTier,
                  token: exp1Config.address,
                },
              ],
            },
          });
          setId(res.id);
          await refetchPermissions();
        } catch (err) {
          const error = (() => {
            if (err instanceof BaseError)
              return err instanceof BaseError
                ? err.walk((err) => err instanceof UserRejectedRequestError)
                : err;
            return err;
          })();

          if (
            (error as Provider.ProviderRpcError)?.code !==
            Provider.UserRejectedRequestError.code
          )
            toast.error("Subscribe Failed", {
              description: (err as Error)?.message ?? "Something went wrong",
            });
        }
      }

      void submit();
    },
    [selectedTier],
  );

  if (permission && activeTier && activeTierIndex !== -1)
    return (
      <div className="w-full max-w-72 rounded-lg border border-gray-100">
        <div className="flex justify-between border-gray-100 border-b p-4 pb-3.5">
          <div className="font-medium text-sm text-gray-400 leading-none">
            Your subscriptions
          </div>
          <button
            onClick={() => revokePermissions.mutate({ id: permission.id })}
          >
            <Trash2Icon className="size-4 text-red-400" />
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <CircleUserRoundIcon className="size-8" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-20 rounded-full bg-gray-100" />
              <div className="font-medium text-sm text-gray-400 leading-none">
                Tier {"I".repeat(activeTierIndex + 1)}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-right font-medium">
            <div className="text-gray-900 leading-none">
              {format(activeTier.limit)}{" "}
              <span className="text-gray-400">EXP1</span>
            </div>
            <div className="text-sm text-gray-400 leading-none">
              each {activeTier.period}
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <form
      className="flex w-full max-w-72 flex-col gap-3"
      onSubmit={handleSubmit}
    >
      <div className="mb-1.5 flex items-center gap-3">
        <CircleUserRoundIcon className="size-8" />
        <div className="h-5 w-full max-w-[138px] rounded-full bg-gray-100" />
      </div>

      <RadioGroup
        className="flex w-full flex-1 select-none gap-2"
        name="tier"
        value={selectedTier}
        // @ts-ignore
        onValueChange={(value) => setSelectedTier(value)}
      >
        {tiers.map((tier, index) => (
          <label
            className="inset-ring flex h-32 p-3.5 flex-1 rounded-xl ring-inset ring-1 ring-gray-600 [&:has(input:checked)]:ring-2 [&:has(input:checked)]:ring-blue-400"
            key={tier.unit}
          >
            <div className="flex h-full flex-col justify-between font-medium">
              <div className="text-gray-400 has-[input:checked]:text-blue-500">
                <RadioGroupItem className="sr-only peer" value={tier.unit} />
                <div className="text-sm leading-none">
                  Tier {"I".repeat(index + 1)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-900 leading-none">
                  {format(tier.amount)} EXP
                </div>
                <div className="text-[10px] text-gray-400 leading-none">
                  per {tier.unit}
                </div>
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>

      <button
        type="submit"
        disabled={grantPermissions.isPending}
        className={
          "flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-blue-500 px-3 text-center font-medium text-white hover:bg-blue-600 disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-500" +
          (!grantPermissions.isPending
            ? " outline-1 outline-dashed outline-blue-400 outline-offset-2"
            : "")
        }
      >
        {grantPermissions.isPending ? (
          <>
            <PictureInPicture2Icon className="size-5" />
            Check prompt
          </>
        ) : (
          "Subscribe"
        )}
      </button>
    </form>
  );
}
