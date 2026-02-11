import os
import json
import psycopg2
from urllib.parse import urlparse

def handler(event, context):
    # Get database connection string from environment
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }

    try:
        # Parse query parameters (if any)
        query_params = event.get('queryStringParameters', {})
        category = query_params.get('category')
        limit = int(query_params.get('limit', 5))

        # Connect to PostgreSQL (Supabase)
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        # Weighted recommendation algorithm:
        # Score = (Rating * 0.7) + (log10(Students Count) * 0.3)
        # Filters by category if provided
        
        sql = """
            SELECT id, title, instructor, price, image_url, category, rating, students_count,
            (CAST(rating AS FLOAT) * 0.7 + LOG(GREATEST(students_count, 1)) * 0.3) as score
            FROM courses
            WHERE is_active = true
        """
        params = []
        
        if category and category != 'all':
            sql += " AND category = %s"
            params.append(category)
            
        sql += " ORDER BY score DESC LIMIT %s"
        params.append(limit)

        cur.execute(sql, params)
        
        rows = cur.fetchall()
        colnames = [desc[0] for desc in cur.description]
        
        results = []
        for row in rows:
            results.append(dict(zip(colnames, row)))

        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'recommendations': results
            }, default=str)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
