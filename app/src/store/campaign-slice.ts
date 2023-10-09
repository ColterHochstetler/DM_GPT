import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

type Campaign = {
  id: string;
  campaignInfo: string;
  characterSheet: string;
  firstScenePlan: string;
  systemMessage: string;
  journal: string;
};  

type CampaignState = {
    campaigns: Campaign[];          // Array of campaigns
    currentCampaignId: string | null; // ID of the currently selected campaign
    isNarrativeMode: boolean;
};

const initialState: CampaignState = {
  campaigns: [
    {
      id: 'defaultCampaignId',
      campaignInfo: 'This is the default campaign',
      characterSheet: 'This is the default character sheet',
      firstScenePlan: 'This is the default first scene plan',
      systemMessage: 'This is the default system message',
      journal: 'Write your journal entries here',
    }
  ],
  currentCampaignId: 'defaultCampaignId',
  isNarrativeMode: false,
};

export const selectCampaigns = (state: { campaign: CampaignState }) => state.campaign.campaigns;
export const selectCurrentCampaignId = (state: { campaign: CampaignState }) => state.campaign.currentCampaignId;

export const selectCurrentCampaignInfo = createSelector(
  [selectCampaigns, selectCurrentCampaignId],
  (campaigns, currentCampaignId) => {
    const campaign = campaigns.find(camp => camp.id === currentCampaignId);
    return campaign ? campaign.campaignInfo : null;
  }
);

export const selectCurrentCampaignSystemMessage = createSelector(
  [selectCampaigns, selectCurrentCampaignId],
  (campaigns, currentCampaignId) => {
    const campaign = campaigns.find(camp => camp.id === currentCampaignId);
    return campaign ? campaign.systemMessage : null;
  }
);

export const selectCurrentCharacterSheet = createSelector(
  [selectCampaigns, selectCurrentCampaignId],
  (campaigns, currentCampaignId) => {
    const campaign = campaigns.find(camp => camp.id === currentCampaignId);
    return campaign ? campaign.characterSheet : null;
  }
);

export const selectCurrentFirstScenePlan = createSelector(
  [selectCampaigns, selectCurrentCampaignId],
  (campaigns, currentCampaignId) => {
    const campaign = campaigns.find(camp => camp.id === currentCampaignId);
    return campaign ? campaign.firstScenePlan : null;
  }
);

export const selectCurrentJournal = createSelector(
  [selectCampaigns, selectCurrentCampaignId],
  (campaigns, currentCampaignId) => {
    const campaign = campaigns.find(camp => camp.id === currentCampaignId);
    return campaign ? campaign.journal : null;
  }
);

export const selectIsNarrativeMode = (state: { campaign: CampaignState }) => state.campaign.isNarrativeMode;

const campaignSlice = createSlice({
    name: 'campaign',
    initialState,
    reducers: {
      addCampaign: (state, action: PayloadAction<Campaign>) => {
        state.campaigns.push(action.payload);
      },
      setCampaigns: (state, action: PayloadAction<Campaign[]>) => {
        state.campaigns = action.payload;
      },
      setCurrentCampaignId: (state, action: PayloadAction<string>) => {
        state.currentCampaignId = action.payload;
      },
      updateCampaignInfo: (state, action: PayloadAction<string>) => {
        if (state.currentCampaignId !== null) {
          const index = state.campaigns.findIndex(camp => camp.id === state.currentCampaignId);
          if (index !== -1) {
            state.campaigns[index].campaignInfo = action.payload;
          }
        }
      },
      updateCharacterSheet: (state, action: PayloadAction<string>) => {
        if (state.currentCampaignId !== null) {
          const index = state.campaigns.findIndex(camp => camp.id === state.currentCampaignId);
          if (index !== -1) {
            state.campaigns[index].characterSheet = action.payload;
          }
        }
      },
      updateFirstScenePlan: (state, action: PayloadAction<string>) => {
        if (state.currentCampaignId !== null) {
          const index = state.campaigns.findIndex(camp => camp.id === state.currentCampaignId);
          if (index !== -1) {
            state.campaigns[index].firstScenePlan = action.payload;
          }
        }
      },  
      setIsNarrativeMode: (state, action: PayloadAction<boolean>) => {
        state.isNarrativeMode = action.payload;
      },
      deleteCampaign: (state, action: PayloadAction<string>) => {
          state.campaigns = state.campaigns.filter(camp => camp.id !== action.payload);
      },
      updateSystemMessage: (state, action: PayloadAction<string>) => {
        if (state.currentCampaignId !== null) {
          const index = state.campaigns.findIndex(camp => camp.id === state.currentCampaignId);
          if (index !== -1) {
            state.campaigns[index].systemMessage = action.payload;
          }
        }
      },
      updateJournal: (state, action: PayloadAction<string>) => {
        if (state.currentCampaignId !== null) {
          const index = state.campaigns.findIndex(camp => camp.id === state.currentCampaignId);
          if (index !== -1) {
            state.campaigns[index].journal = action.payload;
          }
        }
      },
    }
  });

export const { addCampaign, setCampaigns, setCurrentCampaignId, updateCampaignInfo, updateCharacterSheet, deleteCampaign, updateFirstScenePlan, setIsNarrativeMode, updateSystemMessage, updateJournal } = campaignSlice.actions;
export default campaignSlice.reducer;
  