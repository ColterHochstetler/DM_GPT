import { useCallback,} from 'react';
import { Button, Textarea } from '@mantine/core';
import { useAppContext } from '../core/context';
import { useModals } from '@mantine/modals';

export const RenameModal = ({ currentTitle, onUpdateTitle }) => {
    const modals = useModals();

    const onRename = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        modals.openModal({
            title: "Rename",
            children: <div>
                <Textarea
                    id="rename-title"
                    defaultValue={currentTitle}
                    maxLength={500}
                    autosize
                    required />
                <Button
                    fullWidth
                    variant="light" 
                    style={{ marginTop: '1rem' }}
                    onClick={() => {
                        const title = document.querySelector<HTMLInputElement>('#rename-title')?.value?.trim();
                        if (title && title !== currentTitle) {
                            onUpdateTitle(title);
                        }
                        modals.closeAll();
                    }}
                >
                    Save changes
                </Button>
            </div>,
        });
    }, [currentTitle, onUpdateTitle]);

    return <Button onClick={onRename}>Rename</Button>;
};
