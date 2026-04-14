"use client";

import { useState, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export default function SetupPage() {
  const [status, setStatus] = useState<
    "idle" | "waiting" | "success" | "error" | "saving"
  >("idle");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [saved, setSaved] = useState(false);
  const abortRef = useRef(false);

  const requestTokenLoop = useCallback(async () => {
    setStatus("waiting");
    setError("");
    setToken("");
    setSaved(false);
    abortRef.current = false;

    const maxAttempts = 15; // 30 seconds (every 2s)
    for (let i = 0; i < maxAttempts; i++) {
      if (abortRef.current) return;
      setCountdown(30 - i * 2);

      try {
        const res = await fetch("/api/auth/token");
        const json = await res.json();
        if (json.error === 0 && json.data?.token) {
          setToken(json.data.token);
          setStatus("saving");

          // Auto-save to .env
          const saveRes = await fetch("/api/auth/save-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: json.data.token }),
          });
          const saveJson = await saveRes.json();
          setSaved(saveJson.error === 0);
          setStatus("success");
          return;
        }
      } catch {
        // network error, keep trying
      }

      // Wait 2 seconds before next attempt
      await new Promise((r) => setTimeout(r, 2000));
    }

    setStatus("error");
    setError(
      "Timed out — the link button press was not detected. Make sure you're pressing the right button on the iHost."
    );
  }, []);

  const cancel = () => {
    abortRef.current = true;
    setStatus("idle");
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Setup</h1>
        <p className="text-sm text-muted-foreground">
          Connect to your eWeLink CUBE gateway
        </p>
      </div>

      {/* Step 1: Get Access Token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4 text-primary" />
            Access Token
          </CardTitle>
          <CardDescription>
            Click the button below, then press the physical link button on your
            iHost within 30 seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>How it works:</strong> After you click &quot;Start Pairing&quot;, you have 30
                seconds to press the physical link button on your iHost device.
                The app will automatically detect the button press and save the
                token.
              </p>
              <p>
                The token persists until factory reset — you only need to do this
                once.
              </p>
            </div>
          </div>

          {status === "idle" || status === "error" ? (
            <button
              onClick={requestTokenLoop}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Key className="h-4 w-4" />
              Start Pairing (30s window)
            </button>
          ) : status === "waiting" ? (
            <div className="space-y-3">
              <button
                onClick={cancel}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for button press... ({countdown}s)
              </button>
              <p className="text-center text-xs text-muted-foreground animate-pulse">
                Press the link button on your iHost now!
              </p>
            </div>
          ) : null}

          {status === "saving" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving token...
            </div>
          )}

          {status === "success" && token && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  Token received{saved ? " and saved!" : "!"}
                </span>
              </div>
              <div className="space-y-1">
                <Label htmlFor="token" className="text-xs">
                  Access Token
                </Label>
                <Input
                  id="token"
                  value={token}
                  readOnly
                  className="font-mono text-xs"
                />
              </div>
              {saved ? (
                <p className="text-xs text-green-600">
                  Token has been saved to <code className="bg-muted px-1 rounded">.env</code> and
                  is active immediately. Go to the{" "}
                  <a href="/" className="underline font-medium">
                    Dashboard
                  </a>{" "}
                  to see your devices.
                </p>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Add this to your <code className="bg-muted px-1 rounded">.env</code> file:
                  </p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto mt-1">
                    CUBE_ACCESS_TOKEN={token}
                  </pre>
                </div>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Token</span>
            <Badge
              variant={token || saved ? "default" : "secondary"}
              className="text-xs"
            >
              {token || saved ? "Configured" : "Not set"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
