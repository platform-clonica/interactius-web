'use client'

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormField } from '@/components/ui/FormField'
import { Checkbox } from '@/components/ui/Checkbox'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Link } from '@/lib/i18n/routing'

/* ==========================================================================
   Schemas por variant
   ========================================================================== */

const contactoSchema = z.object({
  name: z.string().min(2, 'Introduce tu nombre'),
  company: z.string().min(1, 'Introduce el nombre de tu empresa'),
  email: z.string().email('Introduce un email válido'),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
  privacy: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política para continuar' }),
  }),
})

const newsletterSchema = z.object({
  firstName: z.string().min(2, 'Introduce tu nombre'),
  lastName: z.string().min(2, 'Introduce tu apellido'),
  company: z.string().optional(),
  email: z.string().email('Introduce un email válido'),
  privacy: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política para continuar' }),
  }),
})

const testersSchema = z.object({
  firstName: z.string().min(2, 'Introduce tu nombre'),
  lastName: z.string().min(2, 'Introduce tu apellido'),
  email: z.string().email('Introduce un email válido'),
  profession: z.string().min(2, 'Introduce tu profesión'),
  gender: z.string().optional(),
  city: z.string().min(2, 'Introduce tu ciudad'),
  birthdate: z.string().min(1, 'Introduce tu fecha de nacimiento'),
  privacy: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política para continuar' }),
  }),
})

type ContactoData = z.infer<typeof contactoSchema>
type NewsletterData = z.infer<typeof newsletterSchema>
type TestersData = z.infer<typeof testersSchema>

/* ==========================================================================
   Config por variant
   ========================================================================== */

const VARIANT_CONFIG = {
  contacto: {
    endpoint: '/api/contact',
    schema: contactoSchema,
  },
  newsletter: {
    endpoint: '/api/newsletter',
    schema: newsletterSchema,
  },
  testers: {
    endpoint: '/api/testers',
    schema: testersSchema,
  },
} as const

type Variant = keyof typeof VARIANT_CONFIG

/* ==========================================================================
   Estados del formulario
   ========================================================================== */

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

interface ContactFormProps {
  variant: Variant
}

/* ==========================================================================
   Component
   ========================================================================== */

export function ContactForm({ variant }: ContactFormProps) {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (variant === 'contacto') {
    return (
      <ContactoForm
        status={status}
        setStatus={setStatus}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    )
  }
  if (variant === 'newsletter') {
    return (
      <NewsletterForm
        status={status}
        setStatus={setStatus}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    )
  }
  return (
    <TestersForm
      status={status}
      setStatus={setStatus}
      errorMessage={errorMessage}
      setErrorMessage={setErrorMessage}
    />
  )
}

/* ==========================================================================
   Shared shell — success + submit actions
   ========================================================================== */

interface FormShellProps {
  status: FormStatus
  errorMessage: string | null
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
}

function FormShell({ status, errorMessage, onSubmit, children }: FormShellProps) {
  if (status === 'success') {
    return (
      <div
        role="status"
        className="bg-warm-light p-8 font-mono text-body-sm text-fg"
      >
        <p className="font-medium">Mensaje enviado.</p>
        <p className="mt-3 text-fg/70">
          Gracias por escribirnos. Te responderemos en breve.
        </p>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-busy={status === 'submitting'}
      className="flex flex-col gap-6"
    >
      {children}

      {errorMessage && status === 'error' && (
        <p
          role="alert"
          className="font-mono text-micro text-alert"
        >
          {errorMessage}
        </p>
      )}

      <div className="mt-2">
        <ButtonPrimary
          as="button"
          type="submit"
          variant="dark"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Enviando…' : 'Enviar'}{' '}
          <span aria-hidden="true">↗</span>
        </ButtonPrimary>
      </div>
    </form>
  )
}

/* ==========================================================================
   Checkbox GDPR — común a las 3 variants
   ========================================================================== */

function PrivacyCheckbox({
  register,
  error,
}: {
  register: ReturnType<ReturnType<typeof useForm>['register']> | object
  error?: string
}) {
  return (
    <Checkbox
      {...(register as object)}
      error={error}
      required
    >
      He leído y acepto la{' '}
      <Link
        href="/aviso-legal"
        className="underline underline-offset-4 hover:opacity-70"
      >
        política de privacidad
      </Link>
      .
    </Checkbox>
  )
}

/* ==========================================================================
   Sub-forms por variant
   ========================================================================== */

interface SubFormProps {
  status: FormStatus
  setStatus: (s: FormStatus) => void
  errorMessage: string | null
  setErrorMessage: (m: string | null) => void
}

function ContactoForm({
  status,
  setStatus,
  errorMessage,
  setErrorMessage,
}: SubFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactoData>({
    resolver: zodResolver(contactoSchema),
    mode: 'onBlur',
  })

  const onSubmit: SubmitHandler<ContactoData> = async (data) => {
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch(VARIANT_CONFIG.contacto.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('submit_failed')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage(
        'No hemos podido enviar el mensaje. Inténtalo de nuevo o escríbenos a hola@interactius.com.',
      )
    }
  }

  return (
    <FormShell
      status={status}
      errorMessage={errorMessage}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        {...register('name')}
        label="Nombre"
        name="name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        required
      />
      <FormField
        {...register('company')}
        label="Tu empresa"
        name="company"
        type="text"
        autoComplete="organization"
        error={errors.company?.message}
        required
      />
      <FormField
        {...register('email')}
        label="Tu email de trabajo"
        name="email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        required
      />
      <FormField
        {...register('message')}
        as="textarea"
        label="Tu mensaje"
        name="message"
        error={errors.message?.message}
        required
        autoResize
      />
      <PrivacyCheckbox
        register={register('privacy')}
        error={errors.privacy?.message}
      />
    </FormShell>
  )
}

function NewsletterForm({
  status,
  setStatus,
  errorMessage,
  setErrorMessage,
}: SubFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewsletterData>({
    resolver: zodResolver(newsletterSchema),
    mode: 'onBlur',
  })

  const onSubmit: SubmitHandler<NewsletterData> = async (data) => {
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch(VARIANT_CONFIG.newsletter.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('submit_failed')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage(
        'No hemos podido suscribir tu email. Inténtalo de nuevo en unos minutos.',
      )
    }
  }

  return (
    <FormShell
      status={status}
      errorMessage={errorMessage}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        {...register('firstName')}
        label="Nombre"
        name="firstName"
        type="text"
        autoComplete="given-name"
        error={errors.firstName?.message}
        required
      />
      <FormField
        {...register('lastName')}
        label="Apellido"
        name="lastName"
        type="text"
        autoComplete="family-name"
        error={errors.lastName?.message}
        required
      />
      <FormField
        {...register('company')}
        label="Tu empresa (opcional)"
        name="company"
        type="text"
        autoComplete="organization"
        error={errors.company?.message}
      />
      <FormField
        {...register('email')}
        label="Tu email de trabajo"
        name="email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        required
      />
      <PrivacyCheckbox
        register={register('privacy')}
        error={errors.privacy?.message}
      />
    </FormShell>
  )
}

function TestersForm({
  status,
  setStatus,
  errorMessage,
  setErrorMessage,
}: SubFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestersData>({
    resolver: zodResolver(testersSchema),
    mode: 'onBlur',
  })

  const onSubmit: SubmitHandler<TestersData> = async (data) => {
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch(VARIANT_CONFIG.testers.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('submit_failed')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage(
        'No hemos podido registrar tus datos. Inténtalo de nuevo en unos minutos.',
      )
    }
  }

  return (
    <FormShell
      status={status}
      errorMessage={errorMessage}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField
        {...register('firstName')}
        label="Nombre"
        name="firstName"
        type="text"
        autoComplete="given-name"
        error={errors.firstName?.message}
        required
      />
      <FormField
        {...register('lastName')}
        label="Apellido"
        name="lastName"
        type="text"
        autoComplete="family-name"
        error={errors.lastName?.message}
        required
      />
      <FormField
        {...register('email')}
        label="Tu email"
        name="email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        required
      />
      <FormField
        {...register('profession')}
        label="Profesión"
        name="profession"
        type="text"
        error={errors.profession?.message}
        required
      />
      <FormField
        {...register('gender')}
        as="select"
        label="Género (opcional)"
        name="gender"
        error={errors.gender?.message}
      >
        <option value=""></option>
        <option value="female">Mujer</option>
        <option value="male">Hombre</option>
        <option value="non-binary">No binario</option>
        <option value="other">Otro</option>
        <option value="prefer-not-to-say">Prefiero no decirlo</option>
      </FormField>
      <FormField
        {...register('city')}
        label="Ciudad"
        name="city"
        type="text"
        autoComplete="address-level2"
        error={errors.city?.message}
        required
      />
      <FormField
        {...register('birthdate')}
        label="Fecha de nacimiento"
        name="birthdate"
        type="date"
        autoComplete="bday"
        error={errors.birthdate?.message}
        required
      />
      <PrivacyCheckbox
        register={register('privacy')}
        error={errors.privacy?.message}
      />
    </FormShell>
  )
}
