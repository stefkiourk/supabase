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
import { object, string, boolean } from 'yup'

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
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useStore, useSelectedOrganization } from 'hooks'

import SchemaFunctionSelector from './SchemaFunctionSelector'

const schema = object({
  HOOKS_MFA_VERIFICATION_ATTEMPT_ENABLED: boolean(),
  HOOKS_MFA_VERIFICATION_ATTEMPT_URI: string(),
  HOOKS_PASSWORD_VERIFICATION_ATTEMPT_ENABLED: boolean(),
  HOOKS_PASSWORD_VERIFICATION_ATTEMPT_URI: string(),
})

const FORM_ID = 'enterprise-hooks-config'

const EnterpriseHooksConfig = observer(() => {
  const { ui, meta } = useStore()
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const organization = useSelectedOrganization()
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization!.slug,
  })

  const isTeamsEnterprisePlan =
    isSuccessSubscription && subscription?.plan?.id !== 'free' && subscription?.plan?.id !== 'pro'

  const INITIAL_VALUES = {
    HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED:
      authConfig?.HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED || false,
    HOOK_MFA_VERIFICATION_ATTEMPT_URI: authConfig?.HOOK_MFA_VERIFICATION_ATTEMPT_URI || '',
    HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED:
      authConfig?.HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED || false,
    HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI:
      authConfig?.HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI || '',
  }

  useEffect(() => {
    if (ui.selectedProjectRef) meta.functions.load()
  }, [ui.selectedProjectRef])

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
    <Form id={FORM_ID} initialValues={INITIAL_VALUES} onSubmit={onSubmit} validationSchema={schema}>
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
              title="Enterprise Hooks"
              description="Advanced Auth hooks available only to Teams and Enterprise plan customers."
            />
            <FormPanel
              disabled={true}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={FORM_ID}
                    isSubmitting={isUpdatingConfig}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    disabled={!canUpdateConfig || !isTeamsEnterprisePlan}
                    helper={
                      !canUpdateConfig
                        ? 'You need additional permissions to update authentication settings'
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection header={<FormSectionLabel>MFA Verification Attempt</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <SchemaFunctionSelector
                    id="HOOK_MFA_VERIFICATION_ATTEMPT_URI"
                    descriptionText="Select the function to be called by Supabase Auth each time a user tries to verify an MFA factor. Return a decision on whether to reject the attempt and future ones, or to allow the user to keep trying."
                    values={values}
                    setFieldValue={setFieldValue}
                    disabled={!canUpdateConfig || !isTeamsEnterprisePlan}
                  />
                  {values.HOOK_MFA_VERIFICATION_ATTEMPT_URI && (
                    <Toggle
                      id="HOOK_MFA_VERIFICATION_ATTEMPT_ENABLED"
                      size="tiny"
                      label="Enable hook"
                      layout="flex"
                      disabled={!canUpdateConfig || !isTeamsEnterprisePlan}
                    />
                  )}
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-muted"></div>

              <FormSection
                header={<FormSectionLabel>Password Verification Attempt</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  <SchemaFunctionSelector
                    id="HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI"
                    descriptionText="Select the function to be called by Supabase Auth each time a user tries to sign in with a password. Return a decision whether to allow the user to reject the attempt, or to allow the user to keep trying."
                    values={values}
                    setFieldValue={setFieldValue}
                    disabled={!canUpdateConfig || !isTeamsEnterprisePlan}
                  />
                  {values.HOOK_PASSWORD_VERIFICATION_ATTEMPT_URI && (
                    <Toggle
                      id="HOOK_PASSWORD_VERIFICATION_ATTEMPT_ENABLED"
                      size="tiny"
                      label="Enable hook"
                      layout="flex"
                      disabled={!canUpdateConfig || !isTeamsEnterprisePlan}
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

export default EnterpriseHooksConfig
