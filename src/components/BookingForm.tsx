import { useAppForm } from '../hooks/form'

type Props = {
  onSubmit?: (data: any) => void
}

export default function BookingForm({ onSubmit }: Props) {
  const form = useAppForm({
    defaultValues: {
      name: '',
      phone: '',
      serviceId: '1',
      startTs: Date.now(),
      notes: '',
    },
    onSubmit: ({ value }) => {
      onSubmit?.(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.AppField name="name">{(f) => <f.TextField label="Name" />}</form.AppField>
      <form.AppField name="phone">{(f) => <f.TextField label="Phone" />}</form.AppField>
      <form.AppField name="serviceId">{(f) => <f.Select label="Service" values={[{label: 'Sample Service', value: '1'}]} />}</form.AppField>
      <form.AppField name="startTs">{(f) => <f.TextField label="Start (ms)" />}</form.AppField>

      <div className="flex justify-end">
        <form.AppForm>
          <form.SubscribeButton label="Book" />
        </form.AppForm>
      </div>
    </form>
  )
}

