-- Add elements column to floors table (JSONB array for storing door/window/stairs/elevator)
ALTER TABLE floors ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN floors.elements IS 'Array of floor elements (doors, windows, stairs, elevators) with position and direction';

-- Example element structure:
-- [
--   {
--     "id": "uuid",
--     "element_type": "door",
--     "direction": "north",
--     "position_x": 100,
--     "position_y": 200,
--     "width": 40,
--     "height": 40
--   }
-- ]
