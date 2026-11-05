"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AUTH_ERRORS, AUTH_TEXT, NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/constants"

import { signIn, signUp, type AuthFormState } from "./actions"

const initialState: AuthFormState = { error: null }

// The browser's own validation bubble follows the browser language; these keep it Montenegrin.
const REQUIRED_MESSAGES: Record<string, string> = {
  firstName: AUTH_ERRORS.firstNameRequired,
  lastName: AUTH_ERRORS.lastNameRequired,
  email: AUTH_ERRORS.emailInvalid,
  password: AUTH_ERRORS.passwordRequired,
}

function validation() {
  return {
    onInvalid: (event: React.InvalidEvent<HTMLInputElement>) => {
      const input = event.currentTarget
      const { validity } = input
      input.setCustomValidity(
        validity.typeMismatch
          ? AUTH_ERRORS.emailInvalid
          : validity.tooShort
            ? AUTH_ERRORS.passwordTooShort
            : (REQUIRED_MESSAGES[input.name] ?? ""),
      )
    },
    onInput: (event: React.FormEvent<HTMLInputElement>) => event.currentTarget.setCustomValidity(""),
  }
}

export function AuthForms({ next }: { next: string }) {
  return (
    <Tabs defaultValue="sign-in" className="gap-4">
      <TabsList className="h-11 w-full">
        <TabsTrigger value="sign-in" className="h-full">
          {AUTH_TEXT.signInTab}
        </TabsTrigger>
        <TabsTrigger value="sign-up" className="h-full">
          {AUTH_TEXT.signUpTab}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="sign-in">
        <SignInForm next={next} />
      </TabsContent>
      <TabsContent value="sign-up">
        <SignUpForm next={next} />
      </TabsContent>
    </Tabs>
  )
}

function SignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <Card>
      <CardContent>
        <form action={formAction}>
          <input type="hidden" name="next" value={next} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sign-in-email">{AUTH_TEXT.email}</FieldLabel>
              <Input
                id="sign-in-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                {...validation()}
                defaultValue={state.values?.email}
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sign-in-password">{AUTH_TEXT.password}</FieldLabel>
              <Input
                id="sign-in-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                {...validation()}
                className="h-11"
              />
            </Field>
            {state.error && <FieldError>{state.error}</FieldError>}
            <Button type="submit" disabled={pending} className="h-11 w-full">
              {pending ? AUTH_TEXT.pending : AUTH_TEXT.signInSubmit}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

// first and last name are required (FR-1): `required` stops the browser from sending the form,
// the Server Action and the database refuse it again
function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{AUTH_TEXT.signUpTitle}</CardTitle>
        <CardDescription>{AUTH_TEXT.signUpDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <input type="hidden" name="next" value={next} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sign-up-first-name">{AUTH_TEXT.firstName}</FieldLabel>
              <Input
                id="sign-up-first-name"
                name="firstName"
                autoComplete="given-name"
                required
                {...validation()}
                maxLength={NAME_MAX_LENGTH}
                defaultValue={state.values?.firstName}
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sign-up-last-name">{AUTH_TEXT.lastName}</FieldLabel>
              <Input
                id="sign-up-last-name"
                name="lastName"
                autoComplete="family-name"
                required
                {...validation()}
                maxLength={NAME_MAX_LENGTH}
                defaultValue={state.values?.lastName}
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sign-up-email">{AUTH_TEXT.email}</FieldLabel>
              <Input
                id="sign-up-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                {...validation()}
                defaultValue={state.values?.email}
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sign-up-password">{AUTH_TEXT.password}</FieldLabel>
              <Input
                id="sign-up-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                {...validation()}
                minLength={PASSWORD_MIN_LENGTH}
                className="h-11"
              />
              <FieldDescription>{AUTH_TEXT.passwordHint}</FieldDescription>
            </Field>
            {state.error && <FieldError>{state.error}</FieldError>}
            <Button type="submit" disabled={pending} className="h-11 w-full">
              {pending ? AUTH_TEXT.pending : AUTH_TEXT.signUpSubmit}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
