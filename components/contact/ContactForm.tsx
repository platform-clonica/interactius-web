'use client'

import { useState, useMemo } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'

import { FormField } from '@/components/ui/FormField'
import { Checkbox } from '@/components/ui/Checkbox'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Link } from '@/lib/i18n/navigation'

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
  birthdate: string
  householdSituation: string
  city: string
  state: string
  country: string
  privacy: true
}

type BdwData = {
  firstName: string
  lastName: string
  email: string
  company?: string
  sector?: string
  role?: string
  motivation: string
  subscribe?: boolean
}

/* ==========================================================================
   Config por variant
   ========================================================================== */

const VARIANT_CONFIG = {
  contacto: { endpoint: '/api/contact' },
  newsletter: { endpoint: '/api/newsletter' },
  testers: { endpoint: '/api/testers' },
  bdw: { endpoint: '/api/bdw' },
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
  if (variant === 'bdw') {
    return (
      <BdwForm
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
  href = '/aviso-legal',
}: {
  register: ReturnType<ReturnType<typeof useForm>['register']> | object
  error?: string
  /** Destino del enlace de la política. Por defecto el aviso legal. */
  href?: '/aviso-legal' | '/politica-privacidad'
}) {
  const t = useTranslations('forms')
  return (
    <div data-contact-checkbox>
      <Checkbox {...(register as object)} error={error} required labelClassName="font-mono text-micro text-fg/40 leading-snug">
        {t('privacy.prefix')}{' '}
        <Link href={href} className="underline underline-offset-4 hover:opacity-70">
          {t('privacy.link')}
        </Link>
        {t('privacy.suffix')}
      </Checkbox>
    </div>
  )
}

/* ==========================================================================
   Consentimiento BDW — opt-in marketing opcional + texto de procesamiento
   (réplica del bloque de consentimiento del formulario de HubSpot).
   ========================================================================== */

function BdwConsent({
  register,
}: {
  register: ReturnType<ReturnType<typeof useForm>['register']> | object
}) {
  const t = useTranslations('forms')
  return (
    <div data-contact-checkbox className="flex flex-col gap-3">
      <Checkbox
        {...(register as object)}
        labelClassName="font-mono text-micro text-fg/40 leading-snug"
      >
        {t('bdwForm.subscribe')}
      </Checkbox>
      <p className="font-mono text-micro text-fg/40 leading-snug">
        {t.rich('bdwForm.consentText', {
          link: (chunks) => (
            <Link
              href="/politica-privacidad"
              className="underline underline-offset-4 hover:opacity-70"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
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
        company: z.string().min(2, t('validation.company')),
        message: z.string().min(10, t('validation.messageMin')),
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
          required
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
          required
        />
      </div>
      <p data-contact-field className="font-mono text-micro text-fg/40">{t('requiredHint')}</p>
      <PrivacyCheckbox register={register('privacy')} error={errors.privacy?.message} />
    </FormShell>
  )
}

function BdwForm({ status, setStatus, errorMessage, setErrorMessage }: SubFormProps) {
  const t = useTranslations('forms')

  const schema = useMemo(
    () =>
      z.object({
        firstName: z.string().min(2, t('validation.name')),
        lastName: z.string().min(2, t('validation.lastName')),
        email: z.string().email(t('validation.email')),
        company: z.string().optional(),
        sector: z.string().optional(),
        role: z.string().optional(),
        motivation: z.string().min(2, t('validation.motivation')),
        subscribe: z.boolean().optional(),
      }),
    [t],
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BdwData>({ resolver: zodResolver(schema), mode: 'onBlur' })

  const onSubmit: SubmitHandler<BdwData> = async (data) => {
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch(VARIANT_CONFIG.bdw.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('submit_failed')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage(t('errors.bdw'))
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
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div data-contact-field>
          <FormField
            {...register('firstName')}
            label={t('bdwForm.firstName')}
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
            label={t('bdwForm.lastName')}
            name="lastName"
            type="text"
            autoComplete="family-name"
            error={errors.lastName?.message}
            required
          />
        </div>
      </div>
      <div data-contact-field>
        <FormField
          {...register('email')}
          label={t('bdwForm.email')}
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
          label={t('bdwForm.company')}
          name="company"
          type="text"
          autoComplete="organization"
          error={errors.company?.message}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div data-contact-field>
          <FormField
            {...register('sector')}
            as="select"
            label={t('bdwForm.sector')}
            name="sector"
            error={errors.sector?.message}
          >
            <option value=""></option>
            <option value="Alimentación">{t('bdwForm.sectorOptions.alimentacion')}</option>
            <option value="Banca / Finanzas">{t('bdwForm.sectorOptions.bancaFinanzas')}</option>
            <option value="Energía">{t('bdwForm.sectorOptions.energia')}</option>
            <option value="Gran consumo">{t('bdwForm.sectorOptions.granConsumo')}</option>
            <option value="Industrial">{t('bdwForm.sectorOptions.industrial')}</option>
            <option value="Retail / Moda">{t('bdwForm.sectorOptions.retailModa')}</option>
            <option value="Salud / Farma">{t('bdwForm.sectorOptions.saludFarma')}</option>
            <option value="Sector Público">{t('bdwForm.sectorOptions.sectorPublico')}</option>
            <option value="Seguros">{t('bdwForm.sectorOptions.seguros')}</option>
            <option value="Servicios">{t('bdwForm.sectorOptions.servicios')}</option>
            <option value="Venta al por menor">{t('bdwForm.sectorOptions.ventaMenor')}</option>
            <option value="Otro">{t('bdwForm.sectorOptions.otro')}</option>
          </FormField>
        </div>
        <div data-contact-field>
          <FormField
            {...register('role')}
            label={t('bdwForm.role')}
            name="role"
            type="text"
            autoComplete="organization-title"
            error={errors.role?.message}
          />
        </div>
      </div>
      <div data-contact-field>
        <FormField
          {...register('motivation')}
          as="textarea"
          label={t('bdwForm.motivation')}
          name="motivation"
          error={errors.motivation?.message}
          autoResize
          required
        />
      </div>
      <p data-contact-field className="font-mono text-micro text-fg/40">{t('requiredHint')}</p>
      <BdwConsent register={register('subscribe')} />
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
        company: z.string().min(2, t('validation.company')),
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
          label={t('labels.company')}
          name="company"
          type="text"
          autoComplete="organization"
          error={errors.company?.message}
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
        birthdate: z.string().min(1, t('validation.birthdate')),
        householdSituation: z.string().min(2, t('validation.householdSituation')),
        city: z.string().min(2, t('validation.city')),
        state: z.string().min(2, t('validation.state')),
        country: z.string().min(2, t('validation.country')),
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            {...register('householdSituation')}
            as="select"
            label={t('labels.householdSituation')}
            name="householdSituation"
            error={errors.householdSituation?.message}
            required
          >
            <option value=""></option>
            <option value="Solo">{t('householdOptions.solo')}</option>
            <option value="Pareja">{t('householdOptions.pareja')}</option>
            <option value="Solo con hij@/s">{t('householdOptions.soloConHijos')}</option>
            <option value="Pareja con hij@/s">{t('householdOptions.parejaConHijos')}</option>
            <option value="Piso compartido">{t('householdOptions.pisoCompartido')}</option>
          </FormField>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div data-contact-field>
          <FormField
            {...register('state')}
            label={t('labels.state')}
            name="state"
            type="text"
            autoComplete="address-level1"
            error={errors.state?.message}
            required
          />
        </div>
        <div data-contact-field>
          <FormField
            {...register('country')}
            label={t('labels.country')}
            name="country"
            type="text"
            autoComplete="country-name"
            error={errors.country?.message}
            required
          />
        </div>
      </div>
      <p data-contact-field className="font-mono text-micro text-fg/40">{t('requiredHint')}</p>
      <PrivacyCheckbox register={register('privacy')} error={errors.privacy?.message} />
    </FormShell>
  )
}
