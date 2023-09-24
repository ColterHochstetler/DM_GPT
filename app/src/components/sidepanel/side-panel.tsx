import React from 'react';
import TabContainer, {TabProps} from '../sidebar/tab-container';

type SidePanelProps = {
    tabs: TabProps[];
  };

const SidePanel: React.FC<SidePanelProps> = ({ tabs }) => {
    const sidePanelStyle: React.CSSProperties = {
        width: '30vw', // 30% of the viewport width
        height: '100vh', // full height
        overflowY: 'auto', // add scrolling if content overflows
        position: 'fixed',
        top: 0,
        left: 0, // for the left side panel
        // right: 0, // uncomment for the right side panel
    };

    return (
    <div className="side-panel" style={sidePanelStyle}>
        <TabContainer tabs={tabs} />
      </div>
    );
  };


  export default SidePanel;
