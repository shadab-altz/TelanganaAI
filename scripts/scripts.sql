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


---------- Get Camera Images Statistics

CREATE OR REPLACE FUNCTION sp_getCameraStatistics(sp_camera character varying) 
returns table (sp_species character varying, sp_common_name character varying, sp_count bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT DISTINCT(species), common_name, COUNT(species) FROM january WHERE camera = ''%s'' GROUP BY species, common_name', sp_camera);
END;
$$;


--------- Get monthly statistics


CREATE OR REPLACE FUNCTION sp_getMonthlySpeciesSighting(sp_month character varying) 
returns table (sp_species character varying, sp_common_name character varying, sp_count bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT DISTINCT(species), common_name, COUNT(species) FROM %s GROUP BY species, common_name', sp_month);
END;
$$;


--------- Get the species coordinates


CREATE OR REPLACE FUNCTION sp_getSpeciesHeatmap(sp_month character varying, sp_species character varying) 
returns table (sp_location text, sp_count bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT ST_AsGeoJSON(location) as "location", COUNT("location") FROM %s WHERE species = ''%s'' GROUP BY location ORDER BY "location" ', sp_month, sp_species);
END;
$$;


--------- Get India Basemap


CREATE OR REPLACE FUNCTION public.sp_getindiabasemap()
    RETURNS TABLE(sp_state_name character varying, sp_geometry text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
  return query
  SELECT state_name, ST_AsGeoJSON(ST_Transform(geom, 3857)) FROM india_states;
END;
$BODY$;


--------- Add image for dynamic detection


CREATE OR REPLACE FUNCTION public.sp_addimagefordetection(sp_input_image character varying)
    RETURNS text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
	_id uuid;
BEGIN
	_id := uuid_generate_v4();
	INSERT INTO dynamic_detection(id, input_image, "timestamp", detected)
	VALUES (_id, sp_input_image, CURRENT_TIMESTAMP, false);
	RETURN _id::text;		
END;
$BODY$;


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

