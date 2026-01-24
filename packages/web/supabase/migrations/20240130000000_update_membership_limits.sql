-- Update membership limits to match config: 5 stars = 35 days max
create or replace function calculate_membership_expiry(star_count int)
returns timestamptz as $$
declare
  effective_stars int;
  days_granted int;
begin
  if star_count >= 1 then
    effective_stars := least(star_count, 5);
    days_granted := least(effective_stars * 7, 35);
    return now() + (days_granted * interval '1 day');
  else
    return null;
  end if;
end;
$$ language plpgsql stable;
