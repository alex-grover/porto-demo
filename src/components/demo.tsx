"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { SignInButton } from "./sign-in-button";
import { Subscribe } from "./subscribe";

export function Demo() {
  const account = useAccount();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return <div className="h-72" />;

  if (!account.address)
    return (
      <div className="h-72 pt-4">
        <SignInButton>Sign in to try</SignInButton>
      </div>
    );

  return (
    <div className="h-72">
      <Subscribe />
    </div>
  );
}
