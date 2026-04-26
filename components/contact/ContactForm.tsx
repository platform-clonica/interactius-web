'use client'

import { useState, useMemo } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'

import { FormField } from '@/components/ui/FormField'
import { Checkbox } from '@/components/ui/Checkbox'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Link } from '@/lib/i18n/routing'

/* ==========================================================================
   Types
   ========================================================================== */

type ContactoData = {
  firstName: string
  lastName: string
  email: string
  company?: string
  message?: string
  privacy: true
}

type NewsletterData = {
  firstName: string
  lastName: string
  company?: string
  email: string
  privacy: true
}

type TestersData = {
  firstName: string
  lastName: string
  email: string
  profession: string
  gender?: string
  city: string
  birthdate: string
  privacy: true
}

/* ==========================================================================
   Config por variant
   ========================================================================== */

const VARIANT_CONFIG = {
  contacto: { endpoint: '/api/contact' },
  newsletter: { endpoint: '/api/newsletter' },
  testers: { endpoint: '/api/testers' },
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
  successTitle: string
  successBody: string
  submitLabel: string
  submittingLabel: string
  /** Si true, el botón submit queda inhabilitado (además de durante el envío). */
  submitDisabled?: boolean
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
}

function FormShell({
  status,
  errorMessage,
  successTitle,
  successBody,
  submitLabel,
  submittingLabel,
  submitDisabled,
  onSubmit,
  children,
}: FormShellProps) {
  if (status === 'success') {
    return (
      <div role="status" className="bg-warm-light p-8 font-mono text-body-sm text-fg">
        <p className="font-medium">{successTitle}</p>
        <p className="mt-3 text-fg/70">{successBody}</p>
      </div>
    )
  }

  const disabled = status === 'submitting' || !!submitDisabled

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-busy={status === 'submitting'}
      className="flex flex-col gap-3"
    >
      {children}

      {errorMessage && status === 'error' && (
        <p role="alert" className="font-mono text-micro text-alert">
          {errorMessage}
        </p>
      )}

      <div className="mt-2" data-contact-submit>
        <ButtonPrimary
          as="button"
          type="submit"
          variant="dark"
          disabled={disabled}
        >
          {status === 'submitting' ? submittingLabel : submitLabel}
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
  const t = useTranslations('forms')
  return (
    <div data-contact-checkbox>
      <Checkbox {...(register as object)} error={error} required labelClassName="font-mono text-micro text-fg/40 leading-snug">
        {t('privacy.prefix')}{' '}
        <Link href="/aviso-legal" className="underline underline-offset-4 hover:opacity-70">
          {t('privacy.link')}
        </Link>
        {t('privacy.suffix')}
      </Checkbox>
    </div>
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

function ContactoForm({ status, setStatus, errorMessage, setErrorMessage }: SubFormProps) {
  const t = useTranslations('forms')

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, t('validation.name')),
        lastName: z.string().min(2, t('validation.lastName')),
        email: z.string().email(t('validation.email')),
        company: z.string().optional(),
        message: z.string().optional(),
        privacy: z.literal(true, {
          errorMap: () => ({ message: t('validation.privacy') }),
        }),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContactoData>({ resolver: zodResolver(schema), mode: 'onBlur' })

  const privacyAccepted = watch('privacy') === true

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
      setErrorMessage(t('errors.contacto'))
    }
  }

  return (
    <FormShell
      status={status}
      errorMessage={errorMessage}
      successTitle={t('success.title')}
      successBody={t('success.body')}
      submitLabel={t('submit')}
      submittingLabel={t('submitting')}
      submitDisabled={!privacyAccepted}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div data-contact-field>
        <FormField
          {...register('firstName')}
          label={t('labels.name')}
          name="firstName"
          type="text"
          autoComplete="given-name"
          error={errors.firstName?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('lastName')}
          label={t('labels.lastName')}
          name="lastName"
          type="text"
          autoComplete="family-name"
          error={errors.lastName?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('email')}
          label={t('labels.workEmail')}
          name="email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('company')}
          label={t('labels.company')}
          name="company"
          type="text"
          autoComplete="organization"
          error={errors.company?.message}
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('message')}
          as="textarea"
          label={t('labels.message')}
          name="message"
          error={errors.message?.message}
          autoResize
        />
      </div>
      <p data-contact-field className="font-mono text-micro text-fg/40">{t('requiredHint')}</p>
      <PrivacyCheckbox register={register('privacy')} error={errors.privacy?.message} />
    </FormShell>
  )
}

function NewsletterForm({ status, setStatus, errorMessage, setErrorMessage }: SubFormProps) {
  const t = useTranslations('forms')

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, t('validation.name')),
        lastName: z.string().min(2, t('validation.lastName')),
        company: z.string().optional(),
        email: z.string().email(t('validation.email')),
        privacy: z.literal(true, {
          errorMap: () => ({ message: t('validation.privacy') }),
        }),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewsletterData>({ resolver: zodResolver(schema), mode: 'onBlur' })

  const privacyAccepted = watch('privacy') === true

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
      setErrorMessage(t('errors.newsletter'))
    }
  }

  return (
    <FormShell
      status={status}
      errorMessage={errorMessage}
      successTitle={t('success.title')}
      successBody={t('success.body')}
      submitLabel={t('submit')}
      submittingLabel={t('submitting')}
      submitDisabled={!privacyAccepted}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div data-contact-field>
        <FormField
          {...register('firstName')}
          label={t('labels.name')}
          name="firstName"
          type="text"
          autoComplete="given-name"
          error={errors.firstName?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('lastName')}
          label={t('labels.lastName')}
          name="lastName"
          type="text"
          autoComplete="family-name"
          error={errors.lastName?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('company')}
          label={t('labels.companyOptional')}
          name="company"
          type="text"
          autoComplete="organization"
          error={errors.company?.message}
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('email')}
          label={t('labels.workEmail')}
          name="email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          required
        />
      </div>
      <p data-contact-field className="font-mono text-micro text-fg/40">{t('requiredHint')}</p>
      <PrivacyCheckbox register={register('privacy')} error={errors.privacy?.message} />
    </FormShell>
  )
}

function TestersForm({ status, setStatus, errorMessage, setErrorMessage }: SubFormProps) {
  const t = useTranslations('forms')

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, t('validation.name')),
        lastName: z.string().min(2, t('validation.lastName')),
        email: z.string().email(t('validation.email')),
        profession: z.string().min(2, t('validation.profession')),
        gender: z.string().optional(),
        city: z.string().min(2, t('validation.city')),
        birthdate: z.string().min(1, t('validation.birthdate')),
        privacy: z.literal(true, {
          errorMap: () => ({ message: t('validation.privacy') }),
        }),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TestersData>({ resolver: zodResolver(schema), mode: 'onBlur' })

  const privacyAccepted = watch('privacy') === true

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
      setErrorMessage(t('errors.testers'))
    }
  }

  return (
    <FormShell
      status={status}
      errorMessage={errorMessage}
      successTitle={t('success.title')}
      successBody={t('success.body')}
      submitLabel={t('submit')}
      submittingLabel={t('submitting')}
      submitDisabled={!privacyAccepted}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div data-contact-field>
        <FormField
          {...register('firstName')}
          label={t('labels.name')}
          name="firstName"
          type="text"
          autoComplete="given-name"
          error={errors.firstName?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('lastName')}
          label={t('labels.lastName')}
          name="lastName"
          type="text"
          autoComplete="family-name"
          error={errors.lastName?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('email')}
          label={t('labels.email')}
          name="email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('profession')}
          label={t('labels.profession')}
          name="profession"
          type="text"
          error={errors.profession?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('gender')}
          as="select"
          label={t('labels.gender')}
          name="gender"
          error={errors.gender?.message}
        >
          <option value=""></option>
          <option value="female">{t('genderOptions.female')}</option>
          <option value="male">{t('genderOptions.male')}</option>
          <option value="non-binary">{t('genderOptions.nonBinary')}</option>
          <option value="other">{t('genderOptions.other')}</option>
          <option value="prefer-not-to-say">{t('genderOptions.preferNotToSay')}</option>
        </FormField>
      </div>
      <div data-contact-field>
        <FormField
          {...register('city')}
          label={t('labels.city')}
          name="city"
          type="text"
          autoComplete="address-level2"
          error={errors.city?.message}
          required
        />
      </div>
      <div data-contact-field>
        <FormField
          {...register('birthdate')}
          label={t('labels.birthdate')}
          name="birthdate"
          type="date"
          autoComplete="bday"
          error={errors.birthdate?.message}
          required
        />
      </div>
      <p data-contact-field className="font-mono text-micro text-fg/40">{t('requiredHint')}</p>
      <PrivacyCheckbox register={register('privacy')} error={errors.privacy?.message} />
    </FormShell>
  )
}
