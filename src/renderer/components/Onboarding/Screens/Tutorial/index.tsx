import { Flex, Aside, Logos, Button, Icons, ProgressBar, Drawer, Popin } from "@ledgerhq/react-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useMachine } from "@xstate/react";
import { CSSTransition } from "react-transition-group";
import { Stepper } from "~/renderer/components/Onboarding/Screens/Tutorial/Stepper";
import { ImportYourRecoveryPhrase } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/ImportYourRecoveryPhrase";
import { DeviceHowTo } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/DeviceHowTo";
import { DeviceHowTo2 } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/DeviceHowTo2";
import { PinCode } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/PinCode";
import { PinCodeHowTo } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/PinCodeHowTo";
import { useRecoveryPhraseMachine } from "~/renderer/components/Onboarding/Screens/Tutorial/machines/useRecoveryPhrase";
import { setupNewDevice } from "~/renderer/components/Onboarding/Screens/Tutorial/machines/setupNewDevice";
import { ExistingRecoveryPhrase } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/ExistingRecoveryPhrase";
import { RecoveryHowTo3 } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/RecoveryHowTo3";
import { RecoveryHowTo2 } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/RecoveryHowTo2";
import { RecoveryHowTo1 } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/RecoveryHowTo1";
import { PairMyNano } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/PairMyNano";
import { PinHelp } from "~/renderer/components/Onboarding/Help/PinHelp";
import { HideRecoverySeed } from "~/renderer/components/Onboarding/Help/HideRecoverySeed";
import { RecoverySeed } from "~/renderer/components/Onboarding/Help/RecoverySeed";
import { HideRecoveryPhrase } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/HideRecoveryPhrase";
import { HowToGetStarted } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/HowToGetStarted";
import { NewRecoveryPhrase } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/NewRecoveryPhrase";
import { GenuineCheck } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/GenuineCheck";
import { CarefullyFollowInstructions } from "~/renderer/components/Onboarding/Alerts/CarefullyFollowInstructions";
import { connectSetupDevice } from "~/renderer/components/Onboarding/Screens/Tutorial/machines/connectSetupDevice";
import { PreferLedgerRecoverySeed } from "~/renderer/components/Onboarding/Alerts/PreferLedgerRecoverySeed";
import { UseRecoverySheet } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/UseRecoverySheet";
import { Quizz } from "~/renderer/components/Onboarding/Quizz";
import { QuizFailure } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/QuizFailure";
import { QuizSuccess } from "~/renderer/components/Onboarding/Screens/Tutorial/screens/QuizSuccess";
import { fireConfetti } from "~/renderer/components/Onboarding/Screens/Tutorial/assets/confetti";
import RecoveryWarning from "../../Help/RecoveryWarning";

const screens = {
  howToGetStarted: {
    component: HowToGetStarted,
  },
  importRecoveryPhrase: {
    component: ImportYourRecoveryPhrase,
  },
  deviceHowTo: {
    component: DeviceHowTo,
  },
  deviceHowTo2: {
    component: DeviceHowTo2,
  },
  pinCode: {
    component: PinCode,
  },
  genuineCheck: {
    component: GenuineCheck,
  },
  pinCodeHowTo: {
    component: PinCodeHowTo,
  },
  existingRecoveryPhrase: {
    component: ExistingRecoveryPhrase,
  },
  newRecoveryPhrase: {
    component: NewRecoveryPhrase,
  },
  recoveryHowTo1: {
    component: RecoveryHowTo1,
  },
  recoveryHowTo2: {
    component: RecoveryHowTo2,
  },
  recoveryHowTo3: {
    component: RecoveryHowTo3,
  },
  hideRecoveryPhrase: {
    component: HideRecoveryPhrase,
  },
  useRecoverySheet: {
    component: UseRecoverySheet,
  },
  pairMyNano: {
    component: PairMyNano,
  },
  quizSuccess: {
    component: QuizSuccess,
  },
  quizFailure: {
    component: QuizFailure,
  },
};

const FlowStepperContainer = styled(Flex)`
  width: 100%;
  height: 100%;
`;

const FlowStepperContentContainer = styled(Flex)`
  height: 100%;
  padding: ${p => p.theme.space[10]}px;
`;

const FlowStepperContent = styled(Flex)`
  width: 514px;
  height: 100%;
`;

const StepContent = styled.div`
  flex-grow: 1;
  margin-top: ${p => p.theme.space[10]}px;
  margin-bottom: ${p => p.theme.space[10]}px;
  width: 100%;
`;

type FlowStepperProps = {
  illustration?: React.ReactNode;
  content?: React.ReactNode;
  AsideFooter?: React.ReactNode;
  ProgressBar?: React.ReactNode;
  key: string;
  continueLabel?: string;
  backLabel?: string;
  disableContinue?: boolean;
  disableBack?: boolean;
  children: React.ReactNode;
};

const FooterContainer = styled(Flex).attrs({ rowGap: 3, height: 120 })`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
`;

const FlowStepper: React.FC<FlowStepperProps> = ({
  illustration,
  AsideFooter,
  continueLabel,
  backLabel,
  disableContinue,
  disableBack,
  sendEvent,
  onContinue,
  ProgressBar,
  children,
}) => {
  const handleBack = useCallback(() => {
    sendEvent("PREV");
  }, []);

  const handleContinue = useCallback(() => {
    onContinue ? onContinue() : sendEvent("NEXT");
  }, [onContinue]);

  const handleHelp = useCallback(() => {
    sendEvent("HELP");
  }, []);

  const { t } = useTranslation();

  const Footer = (
    <FooterContainer>{AsideFooter ? <AsideFooter onClick={handleHelp} /> : null}</FooterContainer>
  );

  return (
    <FlowStepperContainer>
      <Aside
        backgroundColor="palette.primary.c60"
        header={
          <Flex justifyContent="center">
            <Logos.LedgerLiveRegular />
          </Flex>
        }
        footer={Footer}
        width="324px"
        p={10}
        position="relative"
      >
        {illustration}
      </Aside>
      <FlowStepperContentContainer flexGrow={1} justifyContent="center">
        <FlowStepperContent flexDirection="column">
          {ProgressBar}
          <StepContent>{children}</StepContent>
          <Flex justifyContent="space-between">
            <Button
              iconPosition="left"
              onClick={handleBack}
              disabled={disableBack}
              variant="main"
              outline
              Icon={() => <Icons.ArrowLeftMedium size={18} />}
            >
              {backLabel ?? t("common.back")}
            </Button>
            <Button
              onClick={handleContinue}
              disabled={disableContinue}
              variant="main"
              Icon={() => <Icons.ArrowRightMedium size={18} />}
            >
              {continueLabel ?? t("common.continue")}
            </Button>
          </Flex>
        </FlowStepperContent>
      </FlowStepperContentContainer>
    </FlowStepperContainer>
  );
};

function Tutorial({ sendEventToParent, machine, parentContext }) {
  const { t } = useTranslation();
  const [state, sendEvent] = useMachine(machine, {
    actions: {
      topLevelPrev: () => sendEventToParent("PREV"),
      topLevelNext: () => sendEventToParent("NEXT"),
      fireConfetti,
    },
    context: {
      deviceId: parentContext.deviceId,
    },
  });

  const Screen = screens[state.value].component;

  const steps = state.context.steps.map(({ id }) => ({
    key: id,
    label: t(`onboarding.screens.tutorial.steps.${id}`),
  }));
  const currentIndex = state.context.steps.findIndex(({ status }) => status === "active");

  return (
    <>
      <Popin isOpen={state.context.quizzOpen}>
        <Quizz onWin={() => sendEvent("QUIZ_SUCCESS")} onLose={() => sendEvent("QUIZ_FAILURE")} />
      </Popin>
      <Popin isOpen={state.context.alerts.beCareful}>
        <CarefullyFollowInstructions
          onClose={() =>
            sendEvent({ type: "SET_ALERT_STATUS", alertId: "beCareful", status: false })
          }
        />
      </Popin>
      <Popin isOpen={state.context.alerts.preferLedgerSeed}>
        <PreferLedgerRecoverySeed
          onClose={() =>
            sendEvent({ type: "SET_ALERT_STATUS", alertId: "preferLedgerSeed", status: false })
          }
        />
      </Popin>
      <Drawer
        isOpen={!!state.context.help.pinCode}
        onClose={() => sendEvent({ type: "SET_HELP_STATUS", helpId: "pinCode", status: false })}
        direction="left"
      >
        <Flex px={40}>
          <PinHelp />
        </Flex>
      </Drawer>
      <Drawer
        isOpen={!!state.context.help.recoveryPhrase}
        onClose={() =>
          sendEvent({ type: "SET_HELP_STATUS", helpId: "recoveryPhrase", status: false })
        }
        direction="left"
      >
        <Flex px={40}>
          <RecoverySeed />
        </Flex>
      </Drawer>
      <Drawer
        isOpen={!!state.context.help.hideRecoveryPhrase}
        onClose={() =>
          sendEvent({ type: "SET_HELP_STATUS", helpId: "hideRecoveryPhrase", status: false })
        }
        direction="left"
      >
        <Flex px={40}>
          <HideRecoverySeed />
        </Flex>
      </Drawer>
      <Drawer
        isOpen={!!state.context.help.recoveryPhraseWarning}
        onClose={() =>
          sendEvent({ type: "SET_HELP_STATUS", helpId: "recoveryPhraseWarning", status: false })
        }
        direction="left"
      >
        <Flex px={40}>
          <RecoveryWarning />
        </Flex>
      </Drawer>

      {!!Screen && (
        <FlowStepper
          illustration={Screen.Illustration}
          AsideFooter={Screen.Footer}
          sendEvent={sendEvent}
          disableContinue={Screen.canContinue ? !Screen.canContinue(state.context) : false}
          ProgressBar={<ProgressBar steps={steps} currentIndex={currentIndex} />}
          continueLabel={Screen.continueLabel}
          onContinue={Screen.onContinue ? () => Screen.onContinue(sendEvent) : null}
        >
          <Screen sendEvent={sendEvent} context={state.context} />
        </FlowStepper>
      )}
    </>
  );
}

export function ConnectSetUpDevice({ sendEvent, context }) {
  return (
    <Tutorial sendEventToParent={sendEvent} machine={connectSetupDevice} parentContext={context} />
  );
}

export function SetupNewDevice({ sendEvent, context }) {
  return (
    <Tutorial sendEventToParent={sendEvent} machine={setupNewDevice} parentContext={context} />
  );
}

export function UseRecoveryPhrase({ sendEvent, context }) {
  return (
    <Tutorial
      sendEventToParent={sendEvent}
      machine={useRecoveryPhraseMachine}
      parentContext={context}
    />
  );
}