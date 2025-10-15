import { useStore } from '@tanstack/react-form'

import { useFieldContext, useFormContext } from '@/hooks/form-context'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea'
import * as ShadcnSelect from '@/components/ui/select'
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import { Switch as ShadcnSwitch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { Service, StaffSelect } from '@/lib/types'

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : label}
        </Button>
      )}
    </form.Subscribe>
  )
}

function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === 'string' ? error : error.message}
          className="text-destructive mt-1 font-bold text-sm"
        >
          {typeof error === 'string' ? error : error.message}
        </div>
      ))}
    </>
  )
}

export function TextField({
  label,
  placeholder,
}: {
  label: string
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <Input
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function TextArea({
  label,
  rows = 3,
}: {
  label: string
  rows?: number
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnTextarea
        id={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Select({
  label,
  values,
  placeholder,
}: {
  label: string
  values: Array<{ label: string; value: string }>
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <ShadcnSelect.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <ShadcnSelect.SelectTrigger className="w-full">
          <ShadcnSelect.SelectValue placeholder={placeholder} />
        </ShadcnSelect.SelectTrigger>
        <ShadcnSelect.SelectContent>
          <ShadcnSelect.SelectGroup>
            <ShadcnSelect.SelectLabel>{label}</ShadcnSelect.SelectLabel>
            {values.map((value) => (
              <ShadcnSelect.SelectItem key={value.value} value={value.value}>
                {value.label}
              </ShadcnSelect.SelectItem>
            ))}
          </ShadcnSelect.SelectGroup>
        </ShadcnSelect.SelectContent>
      </ShadcnSelect.Select>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Slider({ label }: { label: string }) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnSlider
        id={label}
        onBlur={field.handleBlur}
        value={[field.state.value]}
        onValueChange={(value) => field.handleChange(value[0])}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function Switch({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShadcnSwitch
          id={label}
          onBlur={field.handleBlur}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={label}>{label}</Label>
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function DateField({ label }: { label: string }) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <Input
        type="date"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className="w-full border-2 border-border rounded-lg p-3 bg-background text-foreground"
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function ServiceField({ 
  label, 
  services 
}: { 
  label: string
  services: Service[]
}) {
  const field = useFieldContext<number | null>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => field.handleChange(service.id)}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              field.state.value === service.id
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/50"
            }`}
          >
            <h4 className="font-medium">{service.name}</h4>
            <p className="text-sm text-muted-foreground">
              {service.durationMin} min • $
              {(service.priceCents / 100).toFixed(2)}
            </p>
          </button>
        ))}
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function StaffField({ 
  label, 
  staff 
}: { 
  label: string
  staff: StaffSelect[]
}) {
  const field = useFieldContext<number | null>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <Label className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => field.handleChange(s.id)}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              field.state.value === s.id
                ? "border-primary bg-primary/10"
                : "border-border bg-background hover:border-primary/50"
            }`}
          >
            <h4 className="font-medium">{s.name}</h4>
            <p className="text-sm text-muted-foreground capitalize">
              {s.role}
            </p>
          </button>
        ))}
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}

export function TimeField({ 
  label, 
  availableSlots,
  isLoading 
}: { 
  label: string
  availableSlots?: { slots: Array<{ startTs: number }> }
  isLoading?: boolean
}) {
  const field = useFieldContext<number | null>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <Label className="mb-2 text-xl font-bold">
        {label}
      </Label>
      {isLoading ? (
        <div className="text-muted-foreground">Loading times…</div>
      ) : !availableSlots ? (
        <div className="text-muted-foreground">
          Please select a date, service, and staff to see times.
        </div>
      ) : availableSlots.slots.length === 0 ? (
        <div className="text-muted-foreground">
          No available times for that day.
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {availableSlots.slots.map((slot) => (
            <button
              key={slot.startTs}
              type="button"
              onClick={() => field.handleChange(slot.startTs)}
              className={`px-4 py-2 rounded-lg ${
                field.state.value === slot.startTs
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {formatTime(slot.startTs)}
            </button>
          ))}
        </div>
      )}
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  )
}
