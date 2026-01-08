-- Add template column to floors table for storing floor layout templates
-- Templates store unit positions and floor elements that can be applied to all floors

ALTER TABLE floors ADD COLUMN IF NOT EXISTS template JSONB;

-- Comment for documentation
COMMENT ON COLUMN floors.template IS 'Template layout configuration with units and elements that can be applied to all floors in a property';

-- Example template structure:
-- {
--   "units": [
--     {"position_x": 50, "position_y": 50, "width": 120, "height": 100, "relative_index": 1},
--     {"position_x": 180, "position_y": 50, "width": 120, "height": 100, "relative_index": 2}
--   ],
--   "elements": [
--     {"id": "uuid", "element_type": "door", "direction": "north", "position_x": 100, "position_y": 200, "width": 40, "height": 40}
--   ]
-- }
