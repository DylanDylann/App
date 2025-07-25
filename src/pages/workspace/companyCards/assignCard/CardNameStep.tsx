import React from 'react';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import type {FormInputErrors, FormOnyxValues} from '@components/Form/types';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import useAutoFocusInput from '@hooks/useAutoFocusInput';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useThemeStyles from '@hooks/useThemeStyles';
import {addErrorMessage} from '@libs/ErrorUtils';
import {getFieldRequiredErrors} from '@libs/ValidationUtils';
import AccessOrNotFoundWrapper from '@pages/workspace/AccessOrNotFoundWrapper';
import {setAssignCardStepAndData} from '@userActions/CompanyCards';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import INPUT_IDS from '@src/types/form/EditExpensifyCardNameForm';

type CardNameStepProps = {
    /** Current policy id */
    policyID: string | undefined;
};

function CardNameStep({policyID}: CardNameStepProps) {
    const {translate} = useLocalize();
    const {inputCallbackRef} = useAutoFocusInput();
    const styles = useThemeStyles();
    const [assignCard] = useOnyx(ONYXKEYS.ASSIGN_CARD);

    const data = assignCard?.data;

    const submit = (values: FormOnyxValues<typeof ONYXKEYS.FORMS.EDIT_WORKSPACE_COMPANY_CARD_NAME_FORM>) => {
        setAssignCardStepAndData({
            currentStep: CONST.COMPANY_CARD.STEP.CONFIRMATION,
            data: {
                cardName: values.name,
            },
            isEditing: false,
        });
    };

    const validate = (values: FormOnyxValues<typeof ONYXKEYS.FORMS.EDIT_WORKSPACE_COMPANY_CARD_NAME_FORM>): FormInputErrors<typeof ONYXKEYS.FORMS.EDIT_WORKSPACE_COMPANY_CARD_NAME_FORM> => {
        const errors = getFieldRequiredErrors(values, [INPUT_IDS.NAME]);
        const length = values.name.length;

        if (length > CONST.STANDARD_LENGTH_LIMIT) {
            addErrorMessage(errors, INPUT_IDS.NAME, translate('common.error.characterLimitExceedCounter', {length, limit: CONST.STANDARD_LENGTH_LIMIT}));
        }

        return errors;
    };

    return (
        <AccessOrNotFoundWrapper
            policyID={policyID}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_COMPANY_CARDS_ENABLED}
        >
            <ScreenWrapper
                testID={CardNameStep.displayName}
                shouldEnablePickerAvoiding={false}
                enableEdgeToEdgeBottomSafeAreaPadding
            >
                <HeaderWithBackButton
                    title={translate('workspace.moreFeatures.companyCards.cardName')}
                    onBackButtonPress={() => setAssignCardStepAndData({currentStep: CONST.COMPANY_CARD.STEP.CONFIRMATION, isEditing: false})}
                />
                <Text style={[styles.mh5, styles.mt3, styles.mb5]}>{translate('workspace.moreFeatures.companyCards.giveItNameInstruction')}</Text>
                <FormProvider
                    formID={ONYXKEYS.FORMS.EDIT_WORKSPACE_COMPANY_CARD_NAME_FORM}
                    submitButtonText={translate('common.confirm')}
                    onSubmit={submit}
                    style={[styles.flex1, styles.mh5]}
                    enabledWhenOffline
                    validate={validate}
                    shouldHideFixErrorsAlert
                    addBottomSafeAreaPadding
                >
                    <InputWrapper
                        InputComponent={TextInput}
                        inputID={INPUT_IDS.NAME}
                        label={translate('workspace.moreFeatures.companyCards.cardName')}
                        aria-label={translate('workspace.moreFeatures.companyCards.cardName')}
                        role={CONST.ROLE.PRESENTATION}
                        defaultValue={data?.cardName}
                        ref={inputCallbackRef}
                    />
                </FormProvider>
            </ScreenWrapper>
        </AccessOrNotFoundWrapper>
    );
}

CardNameStep.displayName = 'CardNameStep';

export default CardNameStep;
