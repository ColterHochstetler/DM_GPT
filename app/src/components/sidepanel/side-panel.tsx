import React from 'react';
import TabContainer, {TabProps} from './tab-container';

type SidePanelProps = {
  tabs: TabProps[];
  position: 'left' | 'right';
};


const SidePanel: React.FC<SidePanelProps> = ({ tabs, position }) => {
    const sidePanelStyle: React.CSSProperties = {
        width: '26vw',
        height: '100vh', // full height
        overflowY: 'auto', // add scrolling if content overflows
        position: 'fixed',
        top: 0,
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: '1.8rem',
        paddingRight: '1.8rem',
    };

    // Adjust the position based on the prop
    if (position === 'left') {
        sidePanelStyle.left = 0;
    } else if (position === 'right') {
        sidePanelStyle.right = 0;
    }

    return (
        <div className="side-panel" style={sidePanelStyle}>
            <TabContainer tabs={tabs} />
        </div>
    );
};

export default SidePanel;

