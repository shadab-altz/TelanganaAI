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


CREATE OR REPLACE FUNCTION sp_getCameraimages(sp_month character varying, sp_camera character varying) 
returns table (sp_filename character varying, sp_village character varying, sp_latitude double precision, sp_longitude double precision, sp_fromdate text, sp_todate text, sp_filepath character varying) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT filename, village, latitude, longitude, from_date::text, to_date::text, filepath FROM %s WHERE camera = ''%s'' ', sp_month, sp_camera);
END;
$$;


---------- Get Camera Images Statistics

CREATE OR REPLACE FUNCTION sp_getCameraStatistics(sp_month character varying, sp_camera character varying) 
returns table (sp_species character varying, sp_common_name character varying, sp_count bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT sl.scientific_name AS species, ism.common_name::varchar, COUNT(ism.uuid) FROM %s mon INNER JOIN identified_species_map ism ON mon.uuid = ism.uuid INNER JOIN species_library sl ON sl.common_name = ism.common_name WHERE mon.camera = ''%s'' GROUP BY ism.common_name, sl.scientific_name', sp_month, sp_camera);
END;
$$;


--------- Get monthly statistics


CREATE OR REPLACE FUNCTION sp_getMonthlySpeciesSighting(sp_month character varying) 
returns table (sp_species character varying, sp_common_name character varying, sp_count bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT sl.scientific_name AS species, ism.common_name::varchar, COUNT(ism.common_name) FROM %s mon INNER JOIN identified_species_map ism ON mon.uuid = ism.uuid INNER JOIN species_library sl ON sl.common_name = ism.common_name GROUP BY ism.common_name, sl.scientific_name', sp_month);
END;
$$;


--------- Get monthly statistics Range wise


CREATE OR REPLACE FUNCTION sp_getMonthlySpeciesSightingForRange(sp_month character varying, sp_range character varying) 
returns table (sp_species character varying, sp_common_name character varying, sp_count bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT sl.scientific_name AS species, ism.common_name::varchar, COUNT(ism.common_name) FROM %s mon INNER JOIN identified_species_map ism ON mon.uuid = ism.uuid INNER JOIN species_library sl ON sl.common_name = ism.common_name WHERE mon.range = ''%s'' GROUP BY ism.common_name, sl.scientific_name', sp_month, sp_range);
END;
$$;


--------- Get monthly statistics Range and Section wise


CREATE OR REPLACE FUNCTION sp_getMonthlySpeciesSightingForRangeAndSection(sp_month character varying, sp_range character varying, sp_section character varying) 
returns table (sp_species character varying, sp_common_name character varying, sp_count bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT sl.scientific_name AS species, ism.common_name::varchar, COUNT(ism.common_name) FROM %s mon INNER JOIN identified_species_map ism ON mon.uuid = ism.uuid INNER JOIN species_library sl ON sl.common_name = ism.common_name WHERE mon.range = ''%s'' AND mon.section = ''%s'' GROUP BY ism.common_name, sl.scientific_name', sp_month, sp_range, sp_section);
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


--------- Get species list


CREATE OR REPLACE FUNCTION sp_getSpecies(sp_month character varying) 
returns table (sp_species character varying) 
LANGUAGE plpgsql
AS $$
BEGIN
  return query 
	EXECUTE format('SELECT DISTINCT(common_name)::varchar FROM identified_species_map WHERE month = ''%s''', sp_month);
END;
$$;


--------- Get location for species based on its common name


CREATE OR REPLACE FUNCTION public.sp_getspeciesranges(
	sp_month character varying,
	sp_species character varying)
    RETURNS TABLE(sp_from_date text, sp_location text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
  return query 
	EXECUTE format('SELECT DISTINCT(mon.from_date::text) as "from_date", ST_AsGeoJSON(ST_Transform(mon.location, 3857)) as "location" FROM %s mon INNER JOIN identified_species_map ism ON mon.uuid = ism.uuid WHERE ism.common_name = ''%s'' ORDER BY "from_date" ASC', sp_month, sp_species);
END;
$BODY$;


--------- Get Default Statistics for last 7 days from last captured date


CREATE OR REPLACE FUNCTION sp_getDefaultLastWeekStatistics() 
returns table (sp_species character varying, sp_common_name character varying, sp_count bigint) 
LANGUAGE plpgsql
AS $$
DECLARE
	maxDate Date;
	minDate Date;
BEGIN
	maxDate := (SELECT MAX(to_date) FROM (SELECT * FROM january UNION SELECT * FROM february) AS A);
	minDate := (SELECT maxDate - INTERVAL '7 days');
	return query
		SELECT sl.scientific_name AS species, ism.common_name::varchar, COUNT(ism.common_name) FROM february mon INNER JOIN identified_species_map ism ON mon.uuid = ism.uuid INNER JOIN species_library sl ON sl.common_name = ism.common_name WHERE to_date <= maxDate AND to_date >= minDate GROUP BY ism.common_name, sl.scientific_name;
END;
$$;


--------- Get Default camera sighting locations for last 7 days from last captured date


CREATE OR REPLACE FUNCTION sp_getDefaultLastWeekSightingLocations() 
returns table (sp_camera character varying, sp_rotation integer, sp_geometry text) 
LANGUAGE plpgsql
AS $$
DECLARE
	maxDate Date;
	minDate Date;
BEGIN
	maxDate := (SELECT MAX(to_date) FROM (SELECT * FROM january UNION SELECT * FROM february) AS A);
	minDate := (SELECT maxDate - INTERVAL '7 days');
	return query
		SELECT DISTINCT(camera), rotation, ST_AsGeoJSON(ST_Transform(location, 3857)) FROM (
			SELECT * FROM january UNION SELECT * FROM february
		) AS A 
		WHERE to_date <= maxDate AND to_date >= minDate
		GROUP BY camera, rotation, location;
END;
$$;


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

