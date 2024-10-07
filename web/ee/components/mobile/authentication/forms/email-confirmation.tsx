"use client";

import { FC, FormEvent, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { CircleAlert, XCircle } from "lucide-react";
import { IEmailCheckData } from "@plane/types";
import { Button, Input, Spinner } from "@plane/ui";
// helpers
import {
  authErrorHandler,
  EAuthenticationErrorCodes,
  EAuthSteps,
  TAuthErrorInfo,
} from "@/helpers/authentication.helper";
import { cn } from "@/helpers/common.helper";
import { checkEmailValidity } from "@/helpers/string.helper";
// plane web services
import mobileAuthService from "@/plane-web/services/mobile.service";
// services
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

type TMobileAuthEmailValidationForm = {
  email: string;
  handleEmail: (value: string) => void;
  handleAuthStep: (value: EAuthSteps) => void;
  handleErrorInfo: (value: TAuthErrorInfo | undefined) => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
};

export const MobileAuthEmailValidationForm: FC<TMobileAuthEmailValidationForm> = observer((props) => {
  const { email: defaultEmail, handleEmail, handleAuthStep, handleErrorInfo, generateEmailUniqueCode } = props;
  // ref
  const inputRef = useRef<HTMLInputElement>(null);

  // state
  const [isFocused, setIsFocused] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(defaultEmail);

  // derived values
  const emailError = useMemo(
    () => (email && !checkEmailValidity(email) ? { email: "Email is invalid" } : undefined),
    [email]
  );
  const isButtonDisabled = email.length === 0 || Boolean(emailError?.email) || isSubmitting;

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let isUserSignOut = false;
    try {
      await mobileAuthService.currentUser();
      isUserSignOut = true;
    } catch (error) {
      console.error(error);
    }

    let isEmailShouldBeVerified = true;
    if (isUserSignOut) {
      try {
        await mobileAuthService.signOut();
      } catch (error) {
        console.error(error);
        isEmailShouldBeVerified = false;
      }
    }

    if (!isEmailShouldBeVerified) return;

    handleEmail(email);
    setIsSubmitting(true);
    const payload: IEmailCheckData = {
      email: email,
    };

    await authService
      .emailCheck(payload)
      .then(async (response) => {
        if (response.existing) {
          if (response.status === "MAGIC_CODE") {
            handleAuthStep(EAuthSteps.UNIQUE_CODE);
            // generating unique code
            generateEmailUniqueCode(email);
          } else if (response.status === "CREDENTIAL") {
            handleAuthStep(EAuthSteps.PASSWORD);
          }
        } else {
          handleEmail("");
          setEmail("");
          handleAuthStep(EAuthSteps.EMAIL);
          const errorhandler = authErrorHandler(EAuthenticationErrorCodes.USER_DOES_NOT_EXIST, undefined);
          if (errorhandler?.type) handleErrorInfo(errorhandler);
        }
      })
      .catch((error) => {
        const errorhandler = authErrorHandler(error?.error_code?.toString(), email || undefined);
        if (errorhandler?.type) handleErrorInfo(errorhandler);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div>
      <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-onboarding-text-300 font-medium" htmlFor="email">
            Email
          </label>
          <div
            className={cn(
              `relative flex items-center rounded-md bg-onboarding-background-200 border`,
              !isFocused && Boolean(emailError?.email) ? `border-red-500` : `border-onboarding-border-100`
            )}
            tabIndex={-1}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`disable-autofill-style h-[46px] w-full placeholder:text-onboarding-text-400 autofill:bg-red-500 border-0 focus:bg-none active:bg-transparent`}
              autoComplete="on"
              autoFocus
              ref={inputRef}
            />
            {email.length > 0 && (
              <XCircle
                className="h-[46px] w-11 px-3 stroke-custom-text-400 hover:cursor-pointer text-xs"
                onClick={() => {
                  setEmail("");
                  inputRef.current?.focus();
                }}
              />
            )}
          </div>
          {emailError?.email && !isFocused && (
            <p className="flex items-center gap-1 text-xs text-red-600 px-0.5">
              <CircleAlert height={12} width={12} />
              {emailError.email}
            </p>
          )}
        </div>
        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isButtonDisabled}>
          {isSubmitting ? <Spinner height="20px" width="20px" /> : "Continue"}
        </Button>
      </form>
    </div>
  );
});
