// @flow

import React from "react";
import styled, { css } from "styled-components";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { Text, Button } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

const DeviceIllustrationContainer = styled.div`
  transition: transform ease-out 150ms;
  will-change: transform;
  display: flex;
`;

const bkgColor = p => p.theme.colors.palette.neutral.c00;
const bkgColorHover = p => p.theme.colors.palette.neutral.c20;
const borderColorHover = p => p.theme.colors.palette.neutral.c40;

const borderCSS = css`
  ${p => (p.isFirst ? "" : `border-left: 1px solid ${bkgColor(p)};`)}
  ${p => (p.isLast ? "" : `border-right: 1px solid ${bkgColor(p)};`)}
  &:hover {
    ${p => (p.isFirst ? "" : `border-left: 1px solid ${borderColorHover(p)};`)}
    ${p => (p.isLast ? "" : `border-right: 1px solid ${borderColorHover(p)};`)}
  }
`;

const SelectButton = styled(Button)`
  opacity: 0;
  margin-top: 32px;
  background-color: ${p => p.theme.colors.palette.neutral.c100};
`;

const Container = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  padding-top: 38.43px;
  justify-content: center;
  transition: background border 200ms;
  background-color: ${bkgColor};
  &:hover {
    background-color: ${bkgColorHover};
  }
  &:hover ${DeviceIllustrationContainer} {
    transform: translateY(-20px);
  }
  &:hover ${SelectButton} {
    opacity: 1;
  }
  ${borderCSS}
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  align-self: center;
`;

const DeviceName = styled(Text)`
  color: ${p => p.theme.colors.palette.neutral.c100};
`;

interface DeviceSelectOptionProps {
  label: string;
  Illu: React.ReactNode;
  onClick: () => void;
  id: string;
  isFirst: boolean;
  isLast: boolean;
}

export function DeviceSelectorOption({
  id,
  label,
  Illu,
  onClick,
  isFirst,
  isLast,
}: DeviceSelectOptionProps) {
  const { t } = useTranslation();
  return (
    <Container {...{ id, isFirst, isLast }}>
      <ContentContainer>
        <DeviceIllustrationContainer>{Illu}</DeviceIllustrationContainer>
        <DeviceName
          fontSize="28px"
          marginTop="32px"
          color="palette.text.shade100"
          ff="Alpha|Medium"
        >
          {label}
        </DeviceName>
        <SelectButton variant="primary" onClick={onClick}>
          {t("v3.onboarding.screens.selectDevice.selectLabel")}
        </SelectButton>
      </ContentContainer>
    </Container>
  );
}