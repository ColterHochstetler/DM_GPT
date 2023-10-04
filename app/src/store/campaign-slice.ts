import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Campaign = {
  id: string;
  campaignInfo: string;
};  

type CampaignState = {
    campaigns: Campaign[];          // Array of campaigns
    selectedCampaignId: string | null; // ID of the currently selected campaign
};
  
  
const initialState: CampaignState = {
  campaigns: [
    {
      id: 'defaultCampaignId',
      campaignInfo: 'This is the default campaign',
    }
  ],
  selectedCampaignId: 'defaultCampaignId',
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
      setSelectedCampaignId: (state, action: PayloadAction<string>) => {
        state.selectedCampaignId = action.payload;
      },
      updateCampaignInfo: (state, action: PayloadAction<string>) => {
        console.log('updateCampaignInfo() called with action.payload: ', action.payload);
        if (state.selectedCampaignId !== null) {
          const index = state.campaigns.findIndex(camp => camp.id === state.selectedCampaignId);
          if (index !== -1) {
            state.campaigns[index].campaignInfo = action.payload;
          }
        }
      },
        deleteCampaign: (state, action: PayloadAction<string>) => {
          state.campaigns = state.campaigns.filter(camp => camp.id !== action.payload);
        }
      }
  });

export const { addCampaign, setCampaigns, setSelectedCampaignId, updateCampaignInfo, deleteCampaign } = campaignSlice.actions;
export default campaignSlice.reducer;
  