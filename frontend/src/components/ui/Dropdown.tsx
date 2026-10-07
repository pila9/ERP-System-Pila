import { Menu, MenuItem, Button, IconButton } from '@mui/material';
import { MoreVert, ArrowDropDown } from '@mui/icons-material';
import { useState } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  variant?: 'menu' | 'select';
  anchorEl?: HTMLElement | null;
  onClose?: () => void;
}

export function Dropdown({ items, trigger, variant = 'menu', anchorEl: anchorElProp, onClose }: DropdownProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(anchorElProp);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    onClose?.();
  };

  const handleItemClick = (onClick: () => void) => {
    onClick();
    handleClose();
  };

  if (variant === 'select') {
    return (
      <div>
        <Button variant="outlined" endIcon={<ArrowDropDown />} onClick={handleClick}>
          {trigger}
        </Button>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ sx: { minWidth: 200 } }}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider && <MenuItem disabled><hr style={{ border: 'none', borderTop: '1px solid', borderColor: 'divider', margin: 0 }} /></MenuItem>}
              <MenuItem
                onClick={() => handleItemClick(item.onClick)}
                disabled={item.disabled}
                sx={item.danger ? { color: 'error.main', '&:hover': { bgcolor: 'error.light' } } : undefined}
              >
                {item.icon && <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>}
                {item.label}
              </MenuItem>
            </React.Fragment>
          ))}
        </Menu>
      </div>
    );
  }

  return (
    <div>
      <IconButton onClick={handleClick} size="small" aria-label="more actions">
        {trigger || <MoreVert />}
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ sx: { minWidth: 180 } }}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.divider && <MenuItem disabled><hr style={{ border: 'none', borderTop: '1px solid', borderColor: 'divider', margin: 0 }} /></MenuItem>}
            <MenuItem
              onClick={() => handleItemClick(item.onClick)}
              disabled={item.disabled}
              sx={item.danger ? { color: 'error.main', '&:hover': { bgcolor: 'error.light' } } : undefined}
            >
              {item.icon && <Box sx={{ mr: 1, display: 'flex' }}>{item.icon}</Box>}
              {item.label}
            </MenuItem>
          </React.Fragment>
        ))}
      </Menu>
    </div>
  );
}

import { Box } from '@mui/material';