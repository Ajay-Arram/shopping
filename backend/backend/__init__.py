# backend/__init__.py
try:
    import MySQLdb  # noqa
except ImportError:
    try:
        import pymysql
        pymysql.version_info = (2, 2, 8, "final", 0)
        pymysql.install_as_MySQLdb()
    except Exception:
        pass
