import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Form,
  IconAlertCircle,
  Input,
  Toggle,
} from 'ui'
import { object, boolean, string } from 'yup'

import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionLabel,
  FormSectionContent,
} from 'components/ui/Forms'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions, useStore, useSelectedProject } from 'hooks'

import SchemaFunctionSelector from './SchemaFunctionSelector'

const schema = object({
  HOOKS_CUSTOMIZE_ACCESS_TOKEN_ENABLED: boolean(),
  HOOKS_CUSTOMIZE_ACCESS_TOKEN_URI: string(),
})

const BasicHooksConfig = observer(() => {
  const { ui, meta } = useStore()
  const { ref: projectRef } = useParams()
  const { selectedProject } = useSelectedProject()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const formId = 'auth-config-general-form'
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const INITIAL_VALUES = {
    HOOK_CUSTOMIZE_ACCESS_TOKEN_ENABLED: authConfig?.HOOK_CUSTOMIZE_ACCESS_TOKEN_ENABLED || false,
    HOOK_CUSTOMIZE_ACCESS_TOKEN_URI: authConfig?.HOOK_CUSTOMIZE_ACCESS_TOKEN_URI || '',
  }

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }
    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: () => {
          ui.setNotification({
            category: 'error',
            message: `Failed to update settings`,
          })
        },
        onSuccess: () => {
          ui.setNotification({
            category: 'success',
            message: `Successfully updated settings`,
          })
          resetForm({ values: values, initialValues: values })
        },
      }
    )
  }

  useEffect(() => {
    if (ui.selectedProjectRef) meta.functions.load()
  }, [ui.selectedProjectRef])

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <IconAlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <Form id={formId} initialValues={INITIAL_VALUES} onSubmit={onSubmit} validationSchema={schema}>
      {({ handleReset, resetForm, values, initialValues, setFieldValue }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        // Form is reset once remote data is loaded in store
        useEffect(() => {
          if (isSuccess) {
            resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
          }
        }, [isSuccess])

        return (
          <>
            <FormHeader
              title="Hook into Auth (Beta)"
              description="Use PostgreSQL functions to customize the behavior of Supabase Auth to meet your needs."
            />
            <FormPanel
              disabled={true}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isUpdatingConfig}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    disabled={!canUpdateConfig}
                    helper={
                      !canUpdateConfig
                        ? 'You need additional permissions to update authentication settings'
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection
                header={<FormSectionLabel>Customize Access Token (JWT) Claims</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  <SchemaFunctionSelector
                    id="HOOK_CUSTOMIZE_ACCESS_TOKEN_URI"
                    descriptionText="Select the function to be called by Supabase Auth each time a new JWT is created. It should return the claims you wish to be present in the JWT."
                    values={values}
                    setFieldValue={setFieldValue}
                    disabled={!canUpdateConfig}
                  />
                  {values.HOOK_CUSTOMIZE_ACCESS_TOKEN_URI && (
                    <Toggle
                      id="HOOK_CUSTOMIZE_ACCESS_TOKEN_ENABLED"
                      size="tiny"
                      label="Enable hook"
                      layout="flex"
                      disabled={!canUpdateConfig}
                    />
                  )}
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-muted"></div>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
})

export default BasicHooksConfig
