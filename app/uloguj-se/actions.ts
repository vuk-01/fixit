"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { safeNextPath } from "@/lib/auth-paths"
import { AUTH_ERRORS, NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"

export type AuthFormState = {
  error: string | null
  // entered values come back after an error; the password never does
  values?: { firstName?: string; lastName?: string; email?: string }
}

const name = (required: string) =>
  z.string().trim().min(1, required).max(NAME_MAX_LENGTH, AUTH_ERRORS.nameTooLong)

const signInSchema = z.object({
  email: z.email(AUTH_ERRORS.emailInvalid),
  password: z.string().min(1, AUTH_ERRORS.passwordRequired),
})

const signUpSchema = z.object({
  firstName: name(AUTH_ERRORS.firstNameRequired),
  lastName: name(AUTH_ERRORS.lastNameRequired),
  email: z.email(AUTH_ERRORS.emailInvalid),
  password: z.string().min(PASSWORD_MIN_LENGTH, AUTH_ERRORS.passwordTooShort),
})

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "")

function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return AUTH_ERRORS.invalidCredentials
    case "user_already_exists":
    case "email_exists":
      return AUTH_ERRORS.emailTaken
    case "weak_password":
      return AUTH_ERRORS.weakPassword
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return AUTH_ERRORS.rateLimited
    case "email_address_invalid":
    case "validation_failed":
      return AUTH_ERRORS.emailInvalid
    default:
      return AUTH_ERRORS.unknown
  }
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: field(formData, "email").trim() }
  const parsed = signInSchema.safeParse({ email: values.email, password: field(formData, "password") })
  if (!parsed.success) return { error: parsed.error.issues[0].message, values }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: authErrorMessage(error.code), values }

  revalidatePath("/", "layout")
  redirect(safeNextPath(formData.get("next")))
}

// FR-1: first and last name are required; the sign-up trigger copies them into profiles and
// refuses an account without them (DB.md §6, trigger 4). Confirm email is off, so the new
// account is signed in at once (Tech.md, "Registracija").
export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = {
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    email: field(formData, "email").trim(),
  }
  const parsed = signUpSchema.safeParse({ ...values, password: field(formData, "password") })
  if (!parsed.success) return { error: parsed.error.issues[0].message, values }

  const { firstName, lastName, email, password } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName } },
  })
  if (error) return { error: authErrorMessage(error.code), values }
  if (!data.session) return { error: AUTH_ERRORS.noSession, values }

  revalidatePath("/", "layout")
  redirect(safeNextPath(formData.get("next")))
}

// "Odjavi se" (Tech.md §4, ticket 22 Q7): the server client clears the session cookies.
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath("/", "layout")
  redirect("/")
}
