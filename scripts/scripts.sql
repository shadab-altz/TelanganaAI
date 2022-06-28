--------

CREATE OR REPLACE FUNCTION sp_getTelanganaBoundary() 
returns table (sp_state_name character varying, sp_geometry text) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	SELECT state_name, ST_AsGeoJSON(ST_Transform(geom, 3857)) FROM telangana;
END;
$$;

--------

CREATE OR REPLACE FUNCTION sp_getTelanganaCameraTrapLocations(sp_month character varying) 
returns table (sp_camera character varying, sp_rotation integer, sp_geometry text) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('select DISTINCT(camera), rotation, ST_AsGeoJSON(ST_Transform(location, 3857)) FROM %s GROUP BY camera, rotation, location', sp_month);
END;
$$;


---------- Get Ranges


CREATE OR REPLACE FUNCTION sp_getRanges(sp_month character varying) 
returns table (sp_range character varying) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('select DISTINCT(range) FROM %s', sp_month);
END;
$$;


---------- Get Sections

CREATE OR REPLACE FUNCTION sp_getSections(sp_month character varying, sp_range character varying) 
returns table (sp_sections character varying, sp_camera character varying, sp_rotation integer, sp_geometry text) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('select DISTINCT(section), camera, rotation, ST_AsGeoJSON(ST_Transform(location, 3857)) FROM %s WHERE range = ''%s'' ', sp_month, sp_range);
END;
$$;


---------- Get Sections Camera Traps


CREATE OR REPLACE FUNCTION sp_getSectionCameraTraps(sp_month character varying, sp_range character varying, sp_section character varying) 
returns table (sp_sections character varying, sp_rotation integer, sp_geometry text) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('select DISTINCT(section), rotation, ST_AsGeoJSON(ST_Transform(location, 3857)) FROM %s WHERE range = ''%s'' AND section = ''%s'' ', sp_month, sp_range, sp_section);
END;
$$;


---------- Get Camera Images


CREATE OR REPLACE FUNCTION sp_getCameraimages(sp_camera character varying) 
returns table (sp_filename character varying, sp_village character varying, sp_fromdate text, sp_todate text, sp_filepath character varying) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT filename, village, from_date::text, to_date::text, filepath FROM january WHERE camera = ''%s'' ', sp_camera);
END;
$$;

--------- UPDATE the Rotation Column


CREATE OR REPLACE FUNCTION public.update_records()
    RETURNS character varying
    LANGUAGE 'plpgsql'    
AS $BODY$

DECLARE
ref refcursor;
rec RECORD;
err text;
sp_rotation integer;
BEGIN 

FOR rec IN  
	SELECT DISTINCT(camera) FROM february
    LOOP 
		sp_rotation = floor(random()* (360-0 + 1) + 0);
	UPDATE february SET rotation = sp_rotation WHERE camera = rec.camera;
	UPDATE january SET rotation = sp_rotation WHERE camera = rec.camera;
    END LOOP;
RETURN 'DONE';
END;
$BODY$;

