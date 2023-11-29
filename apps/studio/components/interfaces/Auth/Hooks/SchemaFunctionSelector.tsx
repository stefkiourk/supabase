import { useState } from 'react'

import SchemaSelector from 'components/ui/SchemaSelector'
import FunctionSelector from './FunctionSelector'

interface SchemaFunctionSelectorProps {
  id: string
  values: any
  setFieldValue: (field: string, value: any) => void
  descriptionText?: string
  disabled?: boolean
}

const SchemaFunctionSelector = ({
  id,
  values,
  descriptionText,
  setFieldValue,
  disabled = false,
}: SchemaFunctionSelectorProps) => {
  const [_proto, _x, _db, schema, func] = (values[id] || '').split('/')
  const [selectedSchema, setSelectedSchema] = useState(schema || '')
  const [selectedFunc, setSelectedFunc] = useState(func || '')

  return (
    <div className="flex flex-col gap-2">
      <SchemaSelector
        size="tiny"
        showError={false}
        selectedSchemaName={selectedSchema}
        onSelectSchema={(name) => {
          setSelectedSchema(name)
          setSelectedFunc('')
          setFieldValue(id, '')
        }}
        disabled={!!disabled}
      />
      <FunctionSelector
        size="tiny"
        schema={selectedSchema}
        selectedFunctionName={selectedFunc}
        onSelectFunction={(name) => {
          setSelectedFunc(name)
          setFieldValue(id, `pg-functions://postgres/${selectedSchema}/${name}`)
        }}
        disabled={!!disabled}
      />
      {descriptionText && (
        <div className="mt-2 text-foreground-lighter leading-normal text-sm leading-4">
          {descriptionText}
        </div>
      )}
    </div>
  )
}

export default SchemaFunctionSelector
