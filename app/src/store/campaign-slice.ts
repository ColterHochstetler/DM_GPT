import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Campaign = {
    id: string;               // Unique identifier for the campaign
    name: string;             // Name of the campaign
    mainCharacterName: string; // Name of the main character
    genre: string;            // Genre of the story (e.g., "Fantasy", "Sci-Fi", "Mystery")
    tone: string;             // Tone of the story (e.g., "Dark", "Light-hearted", "Serious")
    storyworld: string;       // The world or setting in which the game occurs
    goalsDescription: string; // Description of the campaign's goals or objectives
};
  

type CampaignState = {
    campaigns: Campaign[];          // Array of campaigns
    selectedCampaignId: string | null; // ID of the currently selected campaign
};
  
  
  const initialState: CampaignState = {
    campaigns: [],
    selectedCampaignId: null
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
      updateCampaign: (state, action: PayloadAction<Campaign>) => {
        const index = state.campaigns.findIndex(camp => camp.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      },
      deleteCampaign: (state, action: PayloadAction<string>) => {
        state.campaigns = state.campaigns.filter(camp => camp.id !== action.payload);
      }
    }
  });

export const { addCampaign, setCampaigns, setSelectedCampaignId, updateCampaign, deleteCampaign } = campaignSlice.actions;
export default campaignSlice.reducer;
  