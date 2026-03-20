

## Fix: Device Registration Fails on Duplicate MAC Address

### Problem
The `generate_device_token` database function inserts every new device with `mac_address = 'token-auth'`. The `room_devices` table has a unique constraint on `mac_address`, so only the first device ever succeeds. All subsequent registrations fail with: `duplicate key value violates unique constraint "room_devices_mac_address_key"`.

### Solution
Update the `generate_device_token` function to generate a unique `mac_address` value per device instead of a hardcoded constant.

### Database Migration

Alter the function to use a unique placeholder like `'token-auth-' || v_device_id` or simply use the generated UUID:

```sql
CREATE OR REPLACE FUNCTION public.generate_device_token(p_room_id uuid, p_device_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
    v_device_id UUID;
    v_mac TEXT;
BEGIN
    v_token := encode(gen_random_bytes(32), 'hex');
    v_mac := 'token-' || replace(gen_random_uuid()::text, '-', '');

    INSERT INTO room_devices (room_id, device_name, device_token, mac_address, created_by)
    VALUES (p_room_id, p_device_name, v_token, v_mac, auth.uid())
    RETURNING id INTO v_device_id;

    RETURN json_build_object(
        'success', true,
        'device_id', v_device_id,
        'token', v_token
    );
END;
$$;
```

### No Frontend Changes Needed
The device management UI already handles the flow correctly. Only the database function needs fixing.

