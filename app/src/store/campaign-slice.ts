import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

type Campaign = {
  id: string;
  campaignInfo: string;
  characterSheet: string;
};  

type CampaignState = {
    campaigns: Campaign[];          // Array of campaigns
    currentCampaignId: string | null; // ID of the currently selected campaign
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

export const selectCurrentCharacterSheet = createSelector(
  [selectCampaigns, selectCurrentCampaignId],
  (campaigns, currentCampaignId) => {
    const campaign = campaigns.find(camp => camp.id === currentCampaignId);
    return campaign ? campaign.characterSheet : null;
  }
);
  
  
const initialState: CampaignState = {
  campaigns: [
    {
      id: 'defaultCampaignId',
      campaignInfo: 'This is the default campaign',
      characterSheet: 'This is the default character sheet',
    }
  ],
  currentCampaignId: 'defaultCampaignId',
};

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
        console.log('updateCampaignInfo() called with action.payload: ', action.payload);
        if (state.currentCampaignId !== null) {
          const index = state.campaigns.findIndex(camp => camp.id === state.currentCampaignId);
          if (index !== -1) {
            state.campaigns[index].campaignInfo = action.payload;
          }
        }
      },
      updateCharacterSheet: (state, action: PayloadAction<string>) => {
        console.log('updateCharacterSheet() called with action.payload: ', action.payload);
        if (state.currentCampaignId !== null) {
          const index = state.campaigns.findIndex(camp => camp.id === state.currentCampaignId);
          if (index !== -1) {
            state.campaigns[index].characterSheet = action.payload;
          }
        }
      },
      deleteCampaign: (state, action: PayloadAction<string>) => {
          state.campaigns = state.campaigns.filter(camp => camp.id !== action.payload);
      }
    }
  });

export const { addCampaign, setCampaigns, setCurrentCampaignId, updateCampaignInfo, updateCharacterSheet, deleteCampaign } = campaignSlice.actions;
export default campaignSlice.reducer;
  