import styled from "@emotion/styled";

export const FadingContainerFull = styled.div`
  opacity: 0.2;
  transition: opacity 0.5s ease;
  transition-delay: 2.5s;  // Delay when unhovered

  &:hover {
    opacity: 1;
    transition-delay: 0s;  // No delay when hovered
  }
`;

export const FadingContainerPartial = styled.div`
  opacity: 0.3;
  transition: opacity 0.5s ease;
  transition-delay: 2.5s;  // Delay when unhovered

  &:hover {
    opacity: 1;
    transition-delay: 0s;  // No delay when hovered
  }
`;